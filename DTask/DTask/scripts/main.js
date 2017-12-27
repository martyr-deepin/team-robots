// Generated by CoffeeScript 2.1.0
(function() {
  var checkTodoStatus, checkTodoStatusResult, dtaskUpdate, dtaskUpdateIntvl, dtaskUrl, error, getMarkerLabel, getTowerDetailInfo, hackSlidebarMenu, hackTaskCount, imageFactory, images, port, renderIconsContainer, renderTodoStatusIcons, renderTodoStatusLabel;

  dtaskUrl = "";

  error = false;

  port = chrome.runtime.connect({
    name: "dataconnect"
  });

  port.onDisconnect.addListener(function(msg) {
    console.log("port disconnect ...");
    return port = null;
  });

  port.onMessage.addListener(function(msg) {
    switch (msg.type) {
      case "query_dtask_url_result":
        dtaskUrl = msg.url;
        console.log(dtaskUrl);
        return dtaskUpdate();
    }
  });

  checkTodoStatus = function(todoGroup) {
    return $.ajax({
      type: 'POST',
      url: `${dtaskUrl}/services/for_browser_plugin`,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        todo_guids: todoGroup
      }),
      success: function(data) {
        return checkTodoStatusResult(data);
      },
      error: function(req, msg, e) {
        console.log("check links request error: ", msg);
        return error = true;
      }
    });
  };

  getTowerDetailInfo = function(todoGuid, callback) {
    return $.ajax({
      url: `${dtaskUrl}/services/tower/todos/${todoGuid}`,
      headers: {
        "Tower-Token": towerToken
      },
      dataType: "json",
      success: function(data) {
        return callback(data, todoGuid);
      },
      error: function(req, msg, e) {
        console.log("get tower detail error: ", msg);
        return error = true;
      }
    });
  };

  renderTodoStatusLabel = function(todoGuid, bugzId) {
    // add label
    return $(".todo").each(function(i, e) {
      var bugzLink, bugzUrl;
      if (todoGuid === e.getAttribute("data-guid") && $(e).find(".dtask-label").length === 0) {
        $(e).attr({
          "data-bugzilla-id": bugzId
        });
        bugzUrl = `https://bugzilla.deepin.io/show_bug.cgi?id=${bugzId}`;
        bugzLink = $(document.createElement("a"));
        bugzLink.attr({
          href: bugzUrl,
          target: "_blank",
          title: "Bugzilla: " + bugzId
        });
        bugzLink.text(" Bugzilla ");
        bugzLink.addClass("bugzilla-link");
        bugzLink.addClass("dtask-label");
        bugzLink.addClass("label no-assign");
        return $(e).find(".todo-assign-due").after(bugzLink);
      }
    });
  };

  checkTodoStatusResult = function(data) {
    var j, len, ref, results, todo;
    ref = data.result;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      todo = ref[j];
      results.push((function(todo) {
        renderTodoStatusLabel(todo.towerGuid, todo.bugzillaId);
        return renderTodoStatusIcons(data, todo.towerGuid);
      })(todo));
    }
    return results;
  };

  dtaskUpdate = function() {
    var todoGroup;
    todoGroup = [];
    $(".todo").each(function(i, e) {
      var todoGuid;
      if (!$(e).find(".dtask-marker-label-for-gerrit").length) {
        todoGuid = $(e).attr("data-guid");
        todoGroup.push(todoGuid);
        return $(e).append(getMarkerLabel());
      }
    });
    if (todoGroup.length) {
      checkTodoStatus(todoGroup);
    }
    hackTaskCount();
    return hackSlidebarMenu();
  };

  getMarkerLabel = function() {
    var label;
    label = $(document.createElement("input"));
    label.attr({
      type: "hidden"
    });
    label.addClass("dtask-marker-label-for-gerrit");
    return label;
  };

  images = {};

  imageFactory = function(src) {
    var cached;
    cached = images[name];
    if (!cached) {
      images[src] = $(document.createElement("img"));
      cached = images[src];
      cached.attr("src", `${src}`);
    }
    //cached.addClass("avatar")
    return cached.clone();
  };

  renderIconsContainer = function(icons, parent) {
    var j, len, link, results, status;
    results = [];
    for (j = 0, len = icons.length; j < len; j++) {
      status = icons[j];
      link = $(document.createElement("a"));
      if (status.link) {
        link.attr({
          "title": status.title,
          "href": status.link,
          "target": "_blank"
        });
      } else {
        link.attr({
          "title": status.title,
          "href": "javascript: void(0)"
        });
      }
      link.append(imageFactory(status.image));
      results.push(parent.append(link));
    }
    return results;
  };

  renderTodoStatusIcons = function(data, todoGuid) {
    var el, ref, ref1;
    el = $(`.todo[data-guid=${todoGuid}]`);
    el.find(".dtask-icons").remove();
    return data != null ? (ref = data.result) != null ? (ref1 = ref.status_icons) != null ? ref1.forEach(function(c) {
      var container, groupName;
      container = $(document.createElement("span"));
      groupName = c.group;
      renderIconsContainer(c.icons, container);
      container.html("&nbsp" + container.html() + "&nbsp");
      container.addClass("dtask-icons");
      return el.find(".todo-content").prepend(container);
    }) : void 0 : void 0 : void 0;
  };

  hackTaskCount = function() {
    var hackingDayProjectGuid, s;
    hackingDayProjectGuid = "792c5b3e3279431b9ca757dee0219d8a";
    if (!location.href.match(hackingDayProjectGuid)) {
      s = $(".todos-uncompleted > .todo").size();
      if (s !== 0) {
        return $("#link-feedback").attr("title", `当前页面未完成数:${s}`);
      } else {
        return $("#link-feedback").attr("title", "");
      }
    }
  };

  hackSlidebarMenu = function() {
    var hideCommentsAEL, hideCommentsDivEL, hideStr, menuEL, showStr;
    menuEL = $(".detail-actions");
    if (menuEL.find(".dtask-hide-comment-slidebar").length) {
      return "";
    }
    // hide comments
    hideCommentsDivEL = $(document.createElement("div"));
    hideCommentsDivEL.addClass("item");
    hideCommentsAEL = $(document.createElement("A"));
    hideCommentsAEL.addClass("detail-action");
    hideCommentsAEL.addClass("detail-action-edit");
    hideCommentsAEL.addClass("dtask-hide-comment-slidebar");
    hideStr = "隐藏评论";
    showStr = "显示评论";
    hideCommentsAEL.text(hideStr);
    hideCommentsAEL.click(function() {
      //$(".comments.streams").remove()
      if ($(".comments.streams").css("display") === "block") {
        $(".comments.streams").css({
          display: "none"
        });
        return hideCommentsAEL.text(showStr);
      } else {
        $(".comments.streams").css({
          display: "block"
        });
        return hideCommentsAEL.text(hideStr);
      }
    });
    hideCommentsAEL.attr({
      href: "javascript:;"
    });
    hideCommentsDivEL.append(hideCommentsAEL);
    return menuEL.append(hideCommentsDivEL);
  };

  // start
  port.postMessage({
    type: "query_dtask_url"
  });

  // tmp
  dtaskUpdateIntvl = setInterval(dtaskUpdate, 1000);

  //$(".todo-rest").click () ->
  $(".simple-checkbox:not(.checked)").click(function() {
    var d, self;
    if (!$.cookie("bugzilla_token")) {
      port.postMessage({
        type: "open_bugz_login_tab"
      });
    }
    self = this;
    return d = setInterval(function() {
      var bugId, bugzillaToken;
      bugzillaToken = $.cookie("bugzilla_token");
      if (bugzillaToken) {
        bugId = $(self).closest("li.todo").attr("data-bugzilla-id");
        if (!bugId) {
          window.clearInterval(d);
          return;
        }
        $.ajax({
          type: "POST",
          url: `${dtaskUrl}/services/bugzilla/close`,
          dataType: "json",
          headers: {
            "token": bugzillaToken
          },
          data: {
            bug_id: bugId
          },
          success: function(data) {
            if (!data.error) {
              return port.postMessage({
                type: "notificate",
                title: "关闭完成",
                message: "对应的Bugzilla已关闭"
              });
            } else {
              return port.postMessage({
                type: "notificate",
                title: "关闭失败",
                message: "对应的Bugzilla未关闭"
              });
            }
          },
          error: function() {
            return port.postMessage({
              type: "notificate",
              title: "关闭失败",
              message: "对应的Bugzilla未关闭"
            });
          }
        });
        return window.clearInterval(d);
      }
    }, 1000);
  });

}).call(this);
