function ColumnHandler(/** @type {Array.<String>} */headers, canvasWidth) {
  var m_columnWidth = 0;

  this.getColumnName = function(index) {
    return headers[index];
  };

  this.getColumnIndex = function(name) {
    for (var i = 0; i != headers.length; ++i) {
      if(name != undefined) {
        if (headers[i].toLowerCase() == name.toLowerCase()) {
          return i;
        }
      }
    }
    return -1;
  };

  this.getColumnNumber = function() {
    return headers.length;
  };

  this.getColumnWidth = function() {
    if (m_columnWidth == 0) {
      var MIN_WIDTH = Math.floor(canvasWidth / 7);
      if (this.getColumnNumber() != 0) {
        m_columnWidth = Math.max(Math.floor(canvasWidth / this.getColumnNumber()), MIN_WIDTH);
      } else {
        m_columnWidth = MIN_WIDTH;
      }
    }
    return m_columnWidth;
  };
};
