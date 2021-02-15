var StatusPage = (function() {
  var m_inst = null;

  var m_grid = null;
  var m_columnHandler = null;
  var m_cardTransferNotifier = null;
  var m_cardTransferHandler = null;
  var m_popupAlert = null;

  var m_cards = [];

  function init() {
    var page = new Page("canvas_st", "tab_c2");

    m_popupAlert = new PopupAlert(page);

    m_columnHandler = new ColumnHandler(DataSource.Inst().GetStatusOrder(), page.getCanvas().getWidth());
    m_columnHandler.getColumnIndexByCard = function(/** @type {Card} */card) {
      return m_columnHandler.getColumnIndex(DataSource.Inst().StatusName(card.getStatus()));
    };

    var versions = DataSource.Inst().Versions();
    function versionSorter(a, b) {
      if(a > b) return 1; else return -1;
    };
    versions.sort(versionSorter);

    m_cardTransferNotifier = new CardTransferNotifier();
    m_cardTransferHandler = new CardTransferHandler(m_cardTransferNotifier);

    m_grid = new Grid(m_columnHandler, page, new CardUpdater(versions), getCardBlockName);
    fillGrid(m_grid, versions, m_columnHandler, page);
    m_grid.draw();

    m_cardTransferNotifier.RegisterListener(m_grid);

    document.getElementById("tab_c2").addEventListener("wheel", m_grid.wheelScroll);
    document.addEventListener("keydown", m_grid.keydown);

    addRadioCallback(window, "sg", "radio_sg");
  };

  function fillGrid(grid, versions, columnHandler, page) {
    function addVersion(version) {
      grid.addBlock(new Block(version, columnHandler, page));

      function addIssue(issue) {
        if (issue.version == version && issue.relation == "no") {
          var card = new Card(issue.id, DataSource.Inst().UserName(issue.handler_id), issue.version, issue.summary, issue.description, issue.severity, issue.priority, issue.priorityCode, issue.reproducibility, issue.updateTime, issue.status, 
            true,
            m_cardTransferHandler, columnHandler, page);
          m_cards[issue.id] = card;
          grid.addCard(card);
        }
      };
      DataSource.Inst().IssuesRaw().forEach(addIssue);
    };
    versions.forEach(addVersion);
  };

  function CardUpdater(versions) {
    var m_versions = versions;
    var m_updater = new IssueUpdater();

    this.isPermitted = function(/** @type {Card} */card, /** @type {CardCoords} */src, /** @type {CardCoords} */dst) {
      var src_status = DataSource.Inst().StatusId(m_columnHandler.getColumnName(src.m_column));
      var dst_status = DataSource.Inst().StatusId(m_columnHandler.getColumnName(dst.m_column));

      if (!DataSource.Inst().IsTransferAllowed(card.getId(), src_status, dst_status)) {
        m_popupAlert.show(MessageGenerator.Inst().Get(MessageTypeEnum.NO_STATUS_TRANSITION, [m_columnHandler.getColumnName(src.m_column), m_columnHandler.getColumnName(dst.m_column)]));
        return false;
      }

      var deps = DataSource.Inst().Dependencies(card.getId());
      if (src_status != 80 && src_status != 90 && (dst_status == 80 || dst_status == 90) && deps != null) {
        var unfixed = [];
        var extractUnfixed = function(id) {
          if (m_cards[id].getStatus() != 80 && m_cards[id].getStatus() != 90) {
            unfixed.push(id);
          }
        };
        deps.forEach(extractUnfixed);

        if (unfixed.length != 0) {
          m_popupAlert.show(MessageGenerator.Inst().Get(MessageTypeEnum.DEPENDS_ON_ISSUES, [card.getId(), unfixed]));
          return false;
        }
      }

      return true;
    };

    this.perform = function(/** @type {Card} */card, /** @type {CardCoords} */src, /** @type {CardCoords} */dst) {
      card.refreshUpdateTime();

      var oldVersion = card.getVersion();
      if (src.m_block != dst.m_block) {
        card.setVersion(m_versions[dst.m_block]);
      }

      if (src.m_column != dst.m_column) {
        card.setStatus(DataSource.Inst().StatusId(m_columnHandler.getColumnName(dst.m_column)));
      }

      DevPage.Inst().UpdateCard(oldVersion, card.getOwner(), card);
      RelPage.Inst().UpdateCard(card);

      var data = new IssueData();
      data.InitWStatus(card.getId(), DataSource.Inst().UserId(card.getOwner()), card.getVersion(), card.getStatus());
      m_updater.send(data);
    };
  };

  function getCardBlockName(/** @type {Card} */card) {
    return card.getVersion();
  };

  var UpdateCard = function(oldVersion, oldStatus, /** @type {Card} */newCard) {
    m_grid.updateCard(oldVersion, DataSource.Inst().StatusName(oldStatus), newCard);
  };

  var CreateInst = function() {
    init();
    return {
      UpdateCard: UpdateCard
    };
  };

  return {
    Inst: function () {
      return m_inst || (m_inst = CreateInst());
    }
  };
})();
