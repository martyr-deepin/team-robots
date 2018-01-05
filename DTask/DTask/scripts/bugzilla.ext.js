// Generated by CoffeeScript 2.1.1
(function() {
  var addLinkingGif, bugzDefaultLinksUrl, bugzId, bugzTitle, bugzillaId, createTodolist, createTowerAction, createTowerUrl, dtaskUrl, getDTaskUrl, getProductBack, getProductUrl, getProjectIdUrl, getTodolistGuid, handleAjaxError, initBugzProductDefaultLinks, initCurrentBugzInfo, initUrls, linkDiv, linksHandle, linksUrl, loginToTower, params, port, product, sendCreateTowerTodoRequest, todolistName, towerCsrf, towerToken;

  port = chrome.runtime.connect({
    name: "dataconnect"
  });

  dtaskUrl = "";

  linksUrl = "";

  bugzDefaultLinksUrl = "";

  createTowerUrl = "";

  getProductUrl = "";

  getProjectIdUrl = "";

  todolistName = "从Bugzilla创建的bug";

  params = $.parseParams(location.search.substr(1));

  bugzId = params["id"];

  bugzTitle = $("#short_desc_nonedit_display").html();

  //product = $("#field_container_product").text()
  product = "";

  params = $.parseParams(location.search.substr(1));

  bugzillaId = params["id"];

  towerToken = $.cookie('Tower-Token');

  towerCsrf = $.cookie('Tower-CSRF-Token');

  port.onMessage.addListener(function(msg) {
    switch (msg.type) {
      case "bugz_open_tower_login_tab_result":
        return console.log("open tower login tab");
      //console.log("msg : " + msg.data.msg)
      case "query_dtask_url_result":
        dtaskUrl = msg.url;
        initUrls();
        return initCurrentBugzInfo();
    }
  });

  getDTaskUrl = function() {
    return port.postMessage({
      type: "query_dtask_url"
    });
  };

  loginToTower = function() {
    return port.postMessage({
      type: "bugz_open_tower_login_tab"
    });
  };

  addLinkingGif = function() {
    var gif;
    gif = $(document.createElement("img"));
    gif.attr({
      src: chrome.extension.getURL("images/loading.gif")
    });
    gif.css({
      height: "20px",
      width: "20px"
    });
    linkDiv.html("");
    return linkDiv.append(gif);
  };

  createTowerAction = function() {
    if (!towerToken && !towerCsrf) {
      return loginToTower();
    } else {
      addLinkingGif();
      return $.ajax({
        url: bugzDefaultLinksUrl,
        dataType: "json",
        success: initBugzProductDefaultLinks
      });
    }
  };

  createTodolist = function(projectGuid) {
    return $.ajax({
      url: `${dtaskUrl}/services/tower/projects/${projectGuid}/todolists`,
      type: "POST",
      dataType: "json",
      headers: {
        "Tower-Token": towerToken.replace(/ /g, '+'),
        "Tower-CSRF-token": towerCsrf.replace(/ /g, '+')
      },
      data: {
        "title": todolistName
      },
      success: function(data) {
        var todolistGuid;
        if (!data.error) {
          console.log("create todolist successfully");
          console.log(data);
          todolistGuid = data.result.guid;
          return sendCreateTowerTodoRequest(todolistGuid);
        } else {
          console.log("create tower failed");
          console.log(data.error_message);
          return alert(`创建清单失败 ${data.error_message}`);
        }
      }
    });
  };

  sendCreateTowerTodoRequest = function(guid) {
    console.log("creating tower ...");
    return $.ajax({
      url: `${dtaskUrl}/services/tower/import/bugzilla_bug`,
      type: "PUT",
      dataType: "json",
      headers: {
        "Tower-Token": towerToken.replace(/ /g, '+'),
        "Tower-CSRF-token": towerCsrf.replace(/ /g, '+')
      },
      data: {
        "bug_id": bugzId,
        "todolist_guid": guid,
        "bug_title": bugzTitle
      },
      success: function(data) {
        if (!data.error) {
          console.log("create tower successfully");
          console.log(data);
          return location.reload();
        } else {
          console.log("create tower failed");
          console.log(data.error_message);
          return alert(`创建失败 ${data.error_message}`);
        }
      }
    });
  };

  linksHandle = function(data) {
    var link, tower_todo;
    linkDiv.html("");
    if (data.result === null || data.result.length === 0) {
      link = $(document.createElement("a"));
      link.attr({
        "id": "createTaskBtn",
        "href": "javascript:void(0)"
      });
      link.click(createTowerAction);
      link.text("创建讨论");
      return linkDiv.append(link);
    } else {
      tower_todo = data.result[0];
      link = $(document.createElement("a"));
      return $.ajax({
        url: `${getProjectIdUrl}/${tower_todo}`,
        dataType: "json",
        success: function(data) {
          link.attr({
            "href": `https://tower.im/projects/${data.result}/todos/` + tower_todo,
            "target": "_blank"
          });
          link.text("查看tower");
          return linkDiv.append(link);
        }
      });
    }
  };

  getProductBack = function(data) {
    return product = data.result.product;
  };

  linkDiv = $(document.createElement("div"));

  $("#summary_alias_container").after(linkDiv);

  $("#summary_alias_container").css("display", "inline");

  linkDiv.css({
    display: "inline",
    "margin-left": "20px"
  });

  initBugzProductDefaultLinks = function(data) {
    var bugzDefaultLinks, projectGuid, titile, url;
    if (!data.error) {
      bugzDefaultLinks = data.links;
      projectGuid = bugzDefaultLinks[product];
      // linked with tower project
      if (projectGuid) {
        return getTodolistGuid(projectGuid);
      } else {
        // not linked, skip to choose tower project
        titile = $("#short_desc_nonedit_display").html();
        url = `${createTowerUrl}?id=${bugzillaId}&title=${titile}&tt=${$.cookie('Tower-Token').replace(/ /g, '%2B')}&csrf=${$.cookie('Tower-CSRF-Token').replace(/ /g, '%2B')}`;
        return window.location = url;
      }
    } else {
      return alert(`获取默认项目失败：${data.err_msg}`);
    }
  };

  getTodolistGuid = function(projectGuid) {
    return $.ajax({
      url: `${dtaskUrl}/services/tower/projects/${projectGuid}/todolists`,
      dataType: "json",
      headers: {
        "Tower-Token": towerToken.replace(/ /g, '+'),
        "Tower-CSRF-token": towerCsrf.replace(/ /g, '+')
      },
      success: function(data) {
        var i, item, len, ref, todolistGuid;
        if (!data.error) {
          todolistGuid = "";
          ref = data.result;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            if (item.name === todolistName) {
              todolistGuid = item.guid;
            }
          }
          if (todolistGuid === "") {
            // need to create todolist
            //console.log("creating todolist ...")
            return createTodolist(projectGuid);
          } else {
            return sendCreateTowerTodoRequest(todolistGuid);
          }
        }
      }
    });
  };

  initUrls = function() {
    linksUrl = `${dtaskUrl}/links`;
    bugzDefaultLinksUrl = `${dtaskUrl}/plugin/services/bugz_default_links`;
    createTowerUrl = `${dtaskUrl}/plugin/static/create_tower.html`;
    getProductUrl = `${dtaskUrl}/services/bugzilla/bug`;
    return getProjectIdUrl = `${dtaskUrl}/services/tower/todo`;
  };

  handleAjaxError = function(request, msg, e) {
    return alert(msg);
  };

  initCurrentBugzInfo = function() {
    $.ajax({
      url: linksUrl,
      dataType: "json",
      data: {
        "bugzilla": bugzillaId,
        "tower_todo": "-"
      },
      success: linksHandle
    });
    return $.ajax({
      url: `${getProductUrl}/${bugzillaId}`,
      dataType: "json",
      success: getProductBack,
      error: handleAjaxError
    });
  };

  getDTaskUrl();

}).call(this);
