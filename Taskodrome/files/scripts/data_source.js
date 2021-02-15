var DataSource = (function() {
  var m_inst = null;

  var m_issues_raw = null;
  var m_cooldown_period = 0;
  var m_allowed_statuses_map = null;
  var m_statuses = null;
  var m_statusNames = [];
  var m_statusIds = [];
  var m_status_color_map = null;
  var m_status_order = null;
  var m_versions = null;
  var m_users = null;
  var m_userNames = [];
  var m_userIds = [];
  var m_lang_report_details = null;
  var m_autoassign = false;
  var m_relations = [];
  var m_dependencies = [];

  function getIssuesRaw() {
    var ret = [];
    var array = document.getElementsByClassName("issue_data");
    if (!checkExistence("getIssuesRaw", array)) {
      return ret;
    }

    for (var i = 0; i != array.length; ++i) {
      var el = array[i];
      ret[i] = {
        id : parseInt(el.getAttribute("id"), 10),
        summary : el.getAttribute("summary"),
        status : parseInt(el.getAttribute("status"), 10),
        handler_id : parseInt(el.getAttribute("handler_id"), 10),
        updateTime: el.getAttribute("updateTime"),
        description: el.getAttribute("description"),
        severity: el.getAttribute("severity"),
        priority: el.getAttribute("priority"),
        priorityCode: parseInt(el.getAttribute("priorityCode"), 10),
        reproducibility: el.getAttribute("reproducibility"),
        version: el.getAttribute("version"),
        relation: el.getAttribute("relation")
      };
    }

    return ret;
  };

  var IssuesRaw = function() {
    return m_issues_raw;
  };

  function getCooldownPeriod() {
    var cooldownPeriodDays = parseInt(document.getElementById("cooldown_period_days").getAttribute("value"), 10);
    var cooldownPeriodHours = parseInt(document.getElementById("cooldown_period_hours").getAttribute("value"), 10);
    console.log("getCooldownPeriod: cooldownPeriodDays - " + cooldownPeriodDays
    + " cooldownPeriodHours - " + cooldownPeriodHours);
    return cooldownPeriodHours * 3600 + cooldownPeriodDays * 86400;
  };

  var CooldownPeriod = function() {
    return m_cooldown_period;
  };

  function getStatusesAllowanceMap() {
    var ret = [];
    var array = document.getElementsByClassName("status_pair");
    if (!checkExistence("getStatusesAllowanceMap", array)) {
      return ret;
    }

    for (var i = 0; i != array.length; ++i) {
      var el = array[i];
      var id = parseInt(el.getAttribute("id"), 10);
      ret[id] = [];

      var src_status = el.getAttribute("src_status").split(";");
      src_status.pop();

      var dst_status = el.getAttribute("dst_status").split(";");
      dst_status.pop();

      for (var s_i = 0; s_i != src_status.length; ++s_i) {
        var dst_status_per_src = dst_status[s_i].split(",");
        dst_status_per_src.pop();
        for (var k = 0; k != dst_status_per_src.length; ++k) {
          dst_status_per_src[k] = parseInt(dst_status_per_src[k], 10);
        }
        ret[id][parseInt(src_status[s_i], 10)] = dst_status_per_src;
      }
    }

    return ret;
  };

  function isIndexInArray(array, index) {
    return array.length > index && array[index] != null;
  };

  var IsTransferAllowed = function(id, src_status, dst_status) {
    return isIndexInArray(m_allowed_statuses_map, id)
    && isIndexInArray(m_allowed_statuses_map[id], src_status)
    && m_allowed_statuses_map[id][src_status].indexOf(dst_status) != -1;
  };

  function getStatuses() {
    var ret = [];
    var statusNameMap = document.getElementsByClassName("status_name_map")[0].getAttribute("value");
    if (!checkExistence("getStatuses", statusNameMap)) {
      return ret;
    }
    var pairs = statusNameMap.split(";");

    for (var i = 0, ln = pairs.length - 1; i != ln; ++i) {
      var pair = pairs[i].split(":");
      ret[i] = {
        m_name: pair[1].toLowerCase(),
        m_id: parseInt(pair[0], 10)
      };
    }

    return ret;
  };

  function createStatusMaps() {
    function dispatch(item) {
      m_statusNames[item.m_id] = item.m_name;
      m_statusIds[item.m_name] = item.m_id;
    };
    m_statuses.forEach(dispatch);
  };

  var StatusName = function(id) {
    return m_statusNames[id];
  };

  var StatusId = function(name) {
    return m_statusIds[name.toLowerCase()];
  };

  function getStatusColors() {
    var ret = [];
    var statusColorMap = document.getElementsByClassName("status_color_map")[0].getAttribute("value");
    if (!checkExistence("getStatusColors", statusColorMap)) {
      return ret;
    }

    var pairs = statusColorMap.split(";");

    for (var i = 0, ln = pairs.length - 1; i != ln; ++i) {
      var pair = pairs[i].split(":");
      ret[pair[0]] = pair[1];
    }

    return ret;
  };

  var GetColorOfStatus = function(statusCode) {
    return m_status_color_map[statusCode];
  };

  function getStatusOrder() {
    var ret = [];
    var statusString = document.getElementsByClassName("status_board_order")[0].getAttribute("value");
    if (!checkExistence("getStatusOrder", statusString)) {
      return ret;
    }

    ret = statusString.split(";");
    ret = ret.splice(0, ret.length - 1);
    return ret;
  };

  var GetStatusOrder = function() {
    return m_status_order;
  };

  function getVersions() {
    var ret = [""];
    var versions = document.getElementsByClassName("version");
    for (var i = 0; i != versions.length; ++i) {
      ret.push(versions[i].getAttribute("value"));
    }
    return ret;
  };

  var Versions = function() {
    return m_versions;
  };

  function getUsers() {
    var ret = [""];
    var array = document.getElementsByClassName("user_data");
    if (!checkExistence("getUsers", array)) {
      return ret;
    }

    for (var i = 0; i != array.length; ++i) {
      var el = array[i];
      ret[i] = {
        m_name :  el.getAttribute("name"), 
        m_id : parseInt(el.getAttribute("id"), 10)
      };
    }

    return ret;
  };

  var Users = function() {
    return m_users;
  };

  function createUserMaps() {
    function dispatch(item) {
      m_userNames[item.m_id] = item.m_name;
      m_userIds[item.m_name] = item.m_id;
    };
    m_users.forEach(dispatch);
  };

  var UserName = function(id) {
    return m_userNames[id];
  };

  var UserId = function(name) {
    return m_userIds[name];
  };

  function getLangReportDetails() {
    var ret = [];
    var descr = document.getElementById("lang_description").getAttribute("value");
    ret["description"] = descr ? descr : "Description";
    var sev = document.getElementById("lang_severity").getAttribute("value");
    ret["severity"] = sev ? sev : "Severity";
    var pri = document.getElementById("lang_priority").getAttribute("value");
    ret["priority"] = pri ? pri : "Priority";
    var repr = document.getElementById("lang_reproducibility").getAttribute("value");
    ret["reproducibility"] = repr ? repr : "Reproducibility";
    return ret;
  };

  var LangReportDetails = function() {
    return m_lang_report_details;
  };

  function getAutoassign() {
    var val = document.getElementById("autoassign").getAttribute("value");
    return (val !== "0");
  };

  var IsAutoassign = function() {
    return m_autoassign;
  };

  function getRelations() {
    var ret = [];
    var rels = document.getElementsByClassName("relationship_data");
    if (!checkExistence("getRelations", rels)) {
      return ret;
    }

    for (var i = 0; i != rels.length; ++i) {
      var el = rels[i];
      if (el.getAttribute("type") == 2) {
        ret.push({ id : parseInt(el.getAttribute("id"), 10),
          src_project_id : parseInt(el.getAttribute("src_project_id"), 10),
          dest_project_id : parseInt(el.getAttribute("dest_project_id"), 10),
          src_bug_id : parseInt(el.getAttribute("src_bug_id"), 10),
          dest_bug_id: parseInt(el.getAttribute("dest_bug_id"), 10),
          type: parseInt(el.getAttribute("type"), 10),
        });
      }
    }
    return ret;
  };

  var Relations = function() {
    return m_relations;
  };

  function getDependencies() {
    var ret = [];
    function extractDep(item) {
      if (item.src_project_id == item.dest_project_id && item.type == 2) {
        if (ret[item.src_bug_id] == null) {
          ret[item.src_bug_id] = [];
        }
        ret[item.src_bug_id].push(item.dest_bug_id);
        ret[item.src_bug_id].sort();
      }
    };
    m_relations.forEach(extractDep);
    return ret;
  };

  var Dependencies = function(id) {
    return m_dependencies[id];
  };

  var CreateInst = function() {
    m_issues_raw = getIssuesRaw();
    m_cooldown_period = getCooldownPeriod();
    m_allowed_statuses_map = getStatusesAllowanceMap();
    m_status_color_map = getStatusColors();
    m_status_order = getStatusOrder();
    m_statuses = getStatuses();
    createStatusMaps();
    m_versions = getVersions();
    m_users = getUsers();
    createUserMaps();
    m_lang_report_details = getLangReportDetails();
    m_autoassign = getAutoassign();
    m_relations = getRelations();
    m_dependencies = getDependencies();
    return {
      IssuesRaw: IssuesRaw,
      CooldownPeriod: CooldownPeriod,
      IsTransferAllowed: IsTransferAllowed,
      GetColorOfStatus: GetColorOfStatus,
      GetStatusOrder: GetStatusOrder,
      StatusName: StatusName,
      StatusId: StatusId,
      Versions: Versions,
      Users: Users,
      UserName: UserName,
      UserId: UserId,
      LangReportDetails: LangReportDetails,
      IsAutoassign: IsAutoassign,
      Relations: Relations,
      Dependencies: Dependencies
    };
  };

  return {
    Inst: function () {
      return m_inst || (m_inst = CreateInst());
    }
  };
})();
