var DevPage = (function() {
  var m_inst = null;

  var m_columnHandler = null;
  var m_cardTransferNotifier = null;
  var m_cardTransferHandler = null;
  var m_grid = null;
  
  function init() {
    var page = new Page("canvas_dv", "tab_c1");

    var sortedUsers = [];
    function extractName(item) {
      sortedUsers.push(item.m_name);
    };
    DataSource.Inst().Users().forEach(extractName);

    function userSorter(a, b) {
      if(a > b) return 1; else return -1;
    };
    sortedUsers.sort(userSorter);

    m_columnHandler = new ColumnHandler(sortedUsers, page.getCanvas().getWidth());
    m_columnHandler.getColumnIndexByCard = function(/** @type {Card} */card) {
      return m_columnHandler.getColumnIndex(card.getOwner());
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

    document.getElementById("tab_c1").addEventListener("wheel", m_grid.wheelScroll);
    document.addEventListener("keydown", m_grid.keydown);

    addRadioCallback(window, "dg", "radio_dg");
  };

  function fillGrid(grid, versions, columnHandler, page) {
    function addVersion(version) {
      grid.addBlock(new Block(version, columnHandler, page));

      function addIssue(issue) {
      if (issue.version == version && issue.relation == "no") {
          grid.addCard(new Card(issue.id, DataSource.Inst().UserName(issue.handler_id), issue.version, issue.summary, issue.description, issue.severity, issue.priority, issue.priorityCode, issue.reproducibility, issue.updateTime, issue.status,
            false,
            m_cardTransferHandler, columnHandler, page));
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
      return true;
    };

    this.perform = function(/** @type {Card} */card, /** @type {CardCoords} */src, /** @type {CardCoords} */dst) {
      card.refreshUpdateTime();

      var oldVersion = card.getVersion();
      if (src.m_block != dst.m_block) {
        card.setVersion(m_versions[dst.m_block]);
      }

      var oldStatus = card.getStatus();
      if (DataSource.Inst().IsAutoassign()
      && card.hasNoOwner()
      && card.getStatus() != 80 && card.getStatus() != 90) {
        card.setStatus(50);
      }

      if (src.m_column != dst.m_column) {
        card.setOwner(m_columnHandler.getColumnName(dst.m_column));
      }

      StatusPage.Inst().UpdateCard(oldVersion, oldStatus, card);
      RelPage.Inst().UpdateCard(card);

      var data = new IssueData();
      data.Init(card.getId(), DataSource.Inst().UserId(card.getOwner()), card.getVersion());
      m_updater.send(data);
    };
  };

  function getCardBlockName(/** @type {Card} */card) {
    return card.getVersion();
  };

  var UpdateCard = function(oldVersion, oldOwner, /** @type {Card} */newCard) {
    m_grid.updateCard(oldVersion, oldOwner, newCard);
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
