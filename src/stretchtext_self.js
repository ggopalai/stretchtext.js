// dont use iife, use modules instead
(function () {
  // es5 construct, modules are strict by default in es6
  "use strict";

  const TITLE_WHEN_CLOSED = "Expand";
  const TITLE_WHEN_OPEN = "Collapse";

  // tries to use the native requestAnimationFrame, browser-specific, but falls back to setTimeout
  // requestAnimationFrame shimming.
  /*
		Optimzes animations on the browser. 
		Stops animations in inactive tabs. 
		Good for battery.
	*/
  const requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame || // chrome and safari
    window.mozRequestAnimationFrame || // firefox
    window.oRequestAnimationFrame || // opera
    window.msRequestAnimationFrame || // ie
    function (callback) {
      // default
      window.setTimeout(callback, 1000 / 60);
    };

  /**
   * Toggles the visibility of the HTML element selected by the event.
   *
   * @param {Event} evt
   * @returns
   */
  function toggleSummary(evt) {
    // Prevent the text from being selected if rapidly clicked.
    evt.preventDefault();

    var summary = evt.target;
    var detail = findDetailFor(summary);
    if (!detail) {
      return;
    }

    // CSS Transitions don't work as expected on things set to 'display: none'. Make the
    // stretch details visible if needed, then use a timeout for the transition to take
    // effect.
    if (summary.classList.contains("stretchtext-open")) {
      detail.style.display = "none";
    } else {
      detail.style.display = isBlockLevelDetail(summary) ? "block" : "inline";
    }

    requestAnimationFrame(function () {
      summary.classList.toggle("stretchtext-open");
      detail.classList.toggle("stretchtext-open");

      if (summary.classList.contains("stretchtext-open")) {
        setTitle(summary, TITLE_WHEN_OPEN);
      } else {
        setTitle(summary, TITLE_WHEN_CLOSED);
      }
    });
  }

  /**
   * Checks if the given HTML element is an anchor (<a>) tag.
   *
   * @param {HTMLElement} summary
   * @returns {boolean}
   */
  function isBlockLevelDetail(summary) {
    return summary.nodeName.toLowerCase() === "a";
  }

  /**
   * Set title attribute on the HTML element.
   *
   * @param {HTMLElement} summary
   * @param {String} title
   * @returns
   */
  function setTitle(summary, title) {
    // If the user placed a manual title on the summary leave it alone.
    if (summary.hasAttribute("title")) {
      return;
    } else {
      summary.setAttribute("title", title);
    }
  }

  /**
   * Fetches the next element that needs to be displayed.
   * For <a> tags, gets the element the id in the href.
   * For other tags, gets the next sibling.
   *
   * @param {HTMLElement} summary
   * @returns {HTMLElement}
   */
  function findDetailFor(summary) {
    if (isBlockLevelDetail(summary)) {
      var id = summary.getAttribute("href").replace(/^#/, "");
      var detail = document.getElementById(id);
      if (!detail && window.console) {
        console.error("No StretchText details element with ID: " + id);
      }
      return detail;
    } else {
      var detail = summary.nextElementSibling;
      if (!detail && window.console) {
        console.error("No StretchText details element found for: ", summary);
      }
      return detail;
    }
  }

  /**
   * Gets all the summaries in the document.
   * @returns {Array} of all the summaries in the document
   */
  function getSummaries() {
    let results = [];

    // epub-type
    const summariesByAttribute = Array.from(
      document.querySelectorAll('[epub-type="stretchsummary"]')
    );

    // CSS classes.
    const summariesByClass = Array.from(
      document.getElementsByClassName("stretchsummary")
    );

    results = [...summariesByAttribute, ...summariesByClass];
    return results;
  }

  let loadedCalled = false;
  /**
   * Gets called once the DOM has laoded. Fetches all the summaries
   * and sets the title and binds various eventListeners.
   *
   * @returns
   */
  function loaded() {
    if (loadedCalled) {
      return;
    }
    loadedCalled = true;
    // FIXME(slightlyoff): Add global handlers instead of one per item.
    getSummaries().forEach(function (summary) {
      summary.setAttribute("title", TITLE_WHEN_CLOSED);

      // Listen on mousedown instead of click so that we can prevent text
      // selection if mouse is clicked rapidly.
      summary.addEventListener("mousedown", toggleSummary);

      summary.addEventListener("touchstart", toggleSummary);

      // Link resolving can't be canceled in mousedown event, only in click
      // event.
      summary.addEventListener("click", function (e) {
        e.preventDefault();
      });
    });
  }

  /* 
	Mostly not needed with es6, can just use defer instead. 
	Did not get the need for both?
	Worked with an isolated loaded() call.
	*/
  // specific to the DOM
  window.addEventListener("DOMContentLoaded", loaded);
  // refers to the entire document, including external sources
  if (document.readyState == "complete") {
    loaded();
  }
})();
