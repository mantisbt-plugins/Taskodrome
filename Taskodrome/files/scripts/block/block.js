function Block(name, /** @type {ColumnHandler} */columnHandler, /** @type {Page} */page) {
  var V_OFFSET = 30;

  var m_columns = [];
  var m_cardCount = 0;
  var m_extra_v_offset = 0;
  var m_showIfEmpty = false;

  var m_blockGr = new BlockGraphics(name, columnHandler, page);

  this.m_isPrev = false;
  this.m_isHeader = false;
  this.m_isFooter = false;
  this.m_name = name;
  this.m_bounds = { top : 0, bottom : 0, left : 0, right : 0 };

  construct();
  function construct() {
    for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
      m_columns.push([]);
    }
  };

  this.setExtraVOffset = function(extra_v_offset) {
    m_extra_v_offset = extra_v_offset;
  };

  this.setShowIfEmpty = function(showIfEmpty) {
    m_showIfEmpty = showIfEmpty;
  };

  this.pushCard = function(/** @type {Card} */card) {
    var columnIndex = columnHandler.getColumnIndexByCard(card);
    if (columnIndex != -1) {
      ++m_cardCount;
      m_columns[columnIndex].push(card);
      m_blockGr.incCounter(columnIndex);
    }
    return columnIndex;
  };

  this.draw = function() {
    if (!this.toBeDrawn()) {
      return;
    }

    for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
      var column = m_columns[i];
      for (var k = 0; k != column.length; ++k) {
        column[k].draw();
      }
    }
    m_blockGr.draw();
  };

  this.undraw = function() {
    m_blockGr.undraw();
  };

  this.setTop = function(top) {
    if (this.toBeDrawn()) {
      m_blockGr.setPos(new Position(0, top + V_OFFSET));
      var width = columnHandler.getColumnWidth();
      this.m_bounds = { top : top, bottom : m_blockGr.m_bounds.bottom, left : this.m_bounds.left, right : this.m_bounds.left + width * columnHandler.getColumnNumber() };
      for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
        var pos = new Position(this.m_bounds.left + width * i, m_blockGr.m_bounds.bottom);
        var column = m_columns[i];
        for (var k = 0; k != column.length; ++k) {
          column[k].setPos(pos);
          pos.m_top = column[k].m_bounds.bottom;
        }
        this.m_bounds.bottom = (pos.m_top > this.m_bounds.bottom ? pos.m_top : this.m_bounds.bottom);
      }
      this.m_bounds.bottom += V_OFFSET;

      if (this.m_isPrev) {
        this.setPrev(true);
      } else if (this.m_isHeader) {
        this.setHeader(true);
      } else if (this.m_isFooter) {
        this.setFooter(true);
      }
    } else {
      this.m_bounds = { top : top, bottom : top, left : this.m_bounds.left, right : this.m_bounds.left + width * columnHandler.getColumnNumber() };
      if (this.m_isPrev) {
        this.setPrev(false);
      } else if (this.m_isHeader) {
        this.setHeader(false);
      } else if (this.m_isFooter) {
        this.setFooter(false);
      }
    }
  };

  this.scroll = function(h, v) {
    h = Math.round(h);
    v = Math.round(v);
    if (this.toBeDrawn()) {
      m_blockGr.move(h, (!this.m_isPrev && !this.m_isHeader && !this.m_isFooter ? v : 0));
      for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
        var column = m_columns[i];
        for (var k = 0; k != column.length; ++k) {
          column[k].move(h, v);
        }
      }
    }
    this.m_bounds.left += h;
    this.m_bounds.right += h;
    this.m_bounds.top += v;
    this.m_bounds.bottom += v;
  };

  this.show = function() {
    if (this.toBeDrawn()) {
      for (var i = 0; i != columnHandler.getColumnNumber(); ++i) {
        var column = m_columns[i];
        for (var k = 0; k != column.length; ++k) {
          column[k].show();
        }
      }
      m_blockGr.show();
    }
  };

  this.setPrev = function(status) {
    if (status) {
      if (m_blockGr.isDrawn()) {
        m_blockGr.setPos(new Position(0, m_extra_v_offset));
        m_blockGr.show();
        this.m_isPrev = true;
        // console.log("Block " + name + " is previous"); 
      }
    } else {
      if (!this.m_isHeader && !this.m_isFooter) {
        m_blockGr.setPos(new Position(0, this.m_bounds.top + V_OFFSET));
      }
      this.m_isPrev = false;
      // console.log("Block " + name + " is NOT previous");
    }
    m_blockGr.makePrev(status);
  };

  this.setHeader = function(status) {
    if (status) {
      if (m_blockGr.isDrawn()) {
        m_blockGr.setPos(new Position(0, V_OFFSET + m_extra_v_offset));
        m_blockGr.show();
        this.m_isHeader = true;
        // console.log("Block " + name + " is header");
      }
    } else {
      if (!this.m_isPrev && !this.m_isFooter) {
        m_blockGr.setPos(new Position(0, this.m_bounds.top + V_OFFSET));
      }
      this.m_isHeader = false;
      // console.log("Block " + name + " is NOT header");
    }
  };

  this.setFooter = function(status) {
    if (status) {
      if (m_blockGr.isDrawn()) {
        m_blockGr.setPosInv(new Position(page.getCanvas().getWidth(), page.getCanvas().getHeight() - 25));
        m_blockGr.show();
        this.m_isFooter = true;
        // console.log("Block " + name + " is footer");
      }
    } else {
      if (!this.m_isPrev && !this.m_isHeader) {
        m_blockGr.setPos(new Position(0, this.m_bounds.top + V_OFFSET));
      }
      this.m_isFooter = false;
      // console.log("Block " + name + " is NOT footer");
    }
    m_blockGr.makeFooter(status);
  };

  this.canBePrev = function() {
    return m_blockGr.isDrawn();
  };

  this.canBeHeader = function() {
    return this.m_bounds.top <= m_extra_v_offset && m_blockGr.isDrawn();
  };

  this.canBeFooter = function() {
    return this.m_bounds.top + V_OFFSET + (m_blockGr.m_bounds.bottom - m_blockGr.m_bounds.top) + 25 >= page.getCanvas().getHeight() && m_blockGr.isDrawn();
  };

  this.setOnMouseUp = function(onMouseUp) {
    m_blockGr.setOnMouseUp(onMouseUp);
  };

  this.getCoords_byCard = function(/** @type {Card} */card) {
    var res = new CardCoords();
    var found = false;

    for (var i = 0; !found && i != m_columns.length; ++i) {
      var column = m_columns[i];
      for (var k = 0; !found && k != column.length; ++k) {
        if (card.getId() == column[k].getId()) {
          found = true;
          res.m_column = i;
          res.m_index = k;
        }
      }
    }

    return res;
  };

  this.getCoords_byPos = function(/** @type {Position} */pos) {
    var res = new CardCoords();
    res.m_column = Math.min(Math.floor((pos.m_left - this.m_bounds.left) / columnHandler.getColumnWidth()), m_columns.length - 1);

    var found = false;
    var column = m_columns[res.m_column];
    for (var i = 0; !found && i != column.length; ++i) {
      if (pos.m_top < column[i].m_bounds.bottom) {
        found = true;
        res.m_index = i;
      }
    }

    if (!found) {
      res.m_index = column.length;
    }

    return res;
  };

  this.getCoords = function(columnIndex, cardId) {
    var res = new CardCoords();

    var column = m_columns[columnIndex];
    if (column == null) {
      return res;
    }

    res.m_column = columnIndex;
    for (var i = 0, found = false; !found && i != column.length; ++i) {
      if (cardId == column[i].getId()) {
        found = true;
        res.m_index = i;
      }
    }

    return res;
  };

  this.isPosLower = function(/** @type {Position} */pos) { 
    return pos.m_top > m_blockGr.m_bounds.bottom;
  };

  this.removeCard = function(/** @type {CardCoords} */coords) {
    --m_cardCount;
    if (!this.toBeDrawn()) {
      this.undraw();
    }

    var res = m_columns[coords.m_column].splice(coords.m_index, 1);

    this.setTop(this.m_bounds.top);

    m_blockGr.decCounter(coords.m_column);

    return res[0];
  };

  this.addCard = function(/** @type {Card} */card, /** @type {CardCoords} */coords) {
    ++m_cardCount;

    m_columns[coords.m_column].splice(coords.m_index, 0, card);

    this.draw();
    this.setTop(this.m_bounds.top);

    m_blockGr.incCounter(coords.m_column);
  };

  this.toBeDrawn = function() {
    return (m_cardCount != 0) || m_showIfEmpty;
  };
};
