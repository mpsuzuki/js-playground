let isInt = function(s) {
  return /^[\-\+]?\d+$/.test(s);
};

let isFrac = function(s) {
  return /^[\-\+]?(\d+|\d+\.\d+|\.\d+)$/.test(s);
};

let isFloat = function(s) {
  let frac = s.replace(/^\s*/, "").replace(/\s*$/, "").toUpperCase();
  let exp = "1";
  if (frac.includes("E")) {
    let toks = frac.split("E");
    if (toks.length != 2) { return false; };
    frac = toks[0];
    exp = toks[1];
  };
  if (isInt(exp) && isFrac(frac)) {
    return true;
  };
  return false;
};

document.getElementById("exec").addEventListener("click", function(){
  var past = document.getElementById("on-the-fly");
  if (past) {
    past.parentElement.removeChild(past);
  };

  var dataItems = document.querySelectorAll("div.input-data > div.data-item");
  var jsDataPromises = [];
  var jsDataInits = [];

  var checkVariableNameSyntax = function(s) {
    return /^[A-Za-z_][0-9A-Za-z_]*/.test(s);
  };

  /* to preserve the sequence of the file loading, the index i should be cared */
  var enqueFileReader = function(varName, csvFile, jsDataInits, i) {
    var promise = new Promise(function(fnResolve, fnReject) {
      var fr = new FileReader();
      fr.onload = function(evt) {
        var csvData = []; /* temporal array variable to load CSV file */
        evt.target
           .result
           .split("\n")
           .forEach(function(l){
             csvData.push(
               l.split(/\s*,\s*/)
                .map(
                  function(t){
                    if (isInt(t)) {
                      return parseInt(t);
                    } else
                    if (isFloat(t)) {
                      return parseFloat(t);
                    } else {
                      return t;
                    };
                  }
                )
             );
           });
        /* remove trailing line with no data */
        if (csvData[csvData.length - 1]
          .every(
            function(t){
              return (isNaN(t) || t == null || t == undefined || t.length == 0);
            }
          )
        ) {
          csvData.pop();
        };

        /* construct JavaScript string to set an array by JSON.stringify() */
        jsDataInits[i]  = "let " + varName + " = " + JSON.stringify(csvData) + ";";

        fnResolve(csvFile.name);
      };
      fr.onerror = fnReject;
      fr.readAsText(csvFile, "utf-8");
    });
    return promise;
  };

  for (var i = 0; i < dataItems.length; i += 1) {
    var inputs = dataItems[i].getElementsByTagName("input");

    if (!checkVariableNameSyntax(inputs[0].value)) {
      inputs[0].style.backgroundColor = "pink";
      return;
    } else {
      inputs[0].style.backgroundColor = null;
    };

    /* simple variable-value pair */
    if (dataItems[i].classList.contains("var-name-value-set")) {
      jsDataInits[i]  = "let " + inputs[0].value;
      jsDataInits[i] += " = ";
      jsDataInits[i] += "\'" + inputs[1].value + "\';";
    } else
    /* CSV file loader */
    if (dataItems[i].classList.contains("var-name-file")) {
      var varName = inputs[0].value;
      var csvFile = inputs[1].files[0];
      var promise = enqueFileReader (varName, csvFile, jsDataInits, i);
      jsDataPromises.push(promise);
    };
  };

  var execJS = function() {
    var jsTextBody = document.getElementById("code-text").value;

    var dataItems = document.querySelectorAll("div.output-data > div.data-item");
    var jsTextPost = "\n\n/* postfix to inspect variables */\n"
    jsTextPost += "{\n";
    jsTextPost += '  let v2s = function(v){if(typeof(v)==="undefined"){return "undefined variable"}else{return v}};\n';
    jsTextPost += "  let spans = document.querySelectorAll('div.output-data > div.data-item > span');";
    for (var i = 0; i < dataItems.length; i += 1) {
      var input = dataItems[i].getElementsByTagName("input")[0];
      var span = dataItems[i].getElementsByTagName("span")[0];
      if (checkVariableNameSyntax(input.value)) {
        jsTextPost += 'spans[';
        jsTextPost += i.toString();
        jsTextPost += '].textContent = typeof(';
        jsTextPost += input.value;
        jsTextPost += ') === "undefined" ? "*** undefined variable ***" : JSON.stringify(';
        jsTextPost += input.value;
        jsTextPost += ');\n';
      };
    };
    jsTextPost += "\n}; /* end of postfix */\n";

    var jsTextPre = "if (document.getElementById('break-before-exec').checked) { debugger };\n";
    jsTextPre += jsDataInits.join(";\n"); 
    jsTextPre += "/* JavaScript code in textarea */ {\n";
    jsTextPre += "};\n";

    try {
      var fnTry = new Function(jsTextPre + jsTextBody + jsTextPost);
      fnTry();
    } catch (err) {
      window.alert(err.message);
    };
  };

  Promise.all(jsDataPromises)
         .then(execJS, function(){
            console.log("some csv file could not be loaded\n");
          });
});

document.getElementById("download").addEventListener("click", function(){
  var jsText = document.getElementById("code-text").value;
  var blob = new Blob([jsText], {type: "text/javascript"}); 
  var dataURL = URL.createObjectURL(blob);
  var elmDownloadAnchor = document.getElementById("download-anchor");
  elmDownloadAnchor.setAttribute("href", dataURL);
  elmDownloadAnchor.setAttribute("download", "code.js");
  elmDownloadAnchor.style.display = "block";
});

document.getElementById("download-anchor").addEventListener("click", function(evt){
  document.getElementById("download-anchor").style.display = "none";
  evt.preventDefault();
});

document.getElementById("take-snapshot").addEventListener("click", function(){
  var dt = new Date();
  var k = ("0000" + dt.getFullYear().toString()).slice(-4) +
          ("00" + (dt.getMonth() + 1).toString()).slice(-2) +
          ("00" + dt.getDate().toString()).slice(-2) +
          ("00" + dt.getHours().toString()).slice(-2) +
          ("00" + dt.getMinutes().toString()).slice(-2) +
          ("00" + dt.getSeconds().toString()).slice(-2);

  var jsText = document.getElementById("code-text").value;
  document.cookie = k + "=" + encodeURIComponent(jsText);

  var elmOption = document.createElement("option");
  elmOption.textContent = [k.substr(0,4), k.substr(4,2), k.substr(6,2)].join("/") + "-" +
                          [k.substr(8,2), k.substr(10,2), k.substr(12,2)].join(":");
  elmOption.setAttribute("data-snapshot", encodeURIComponent(jsText));

  var elmSELECT = document.getElementById("revert-snapshot");
  elmSELECT.appendChild(elmOption);
  elmSELECT.selectedIndex = elmSELECT.children.length - 1;
});

document.getElementById("revert-snapshot").addEventListener("change", function(){
  var pastJsTextEsc = document.getElementById("revert-snapshot").selectedOptions[0].getAttribute("data-snapshot");
  document.getElementById("code-text").value = decodeURIComponent(pastJsTextEsc);
});

document.getElementById("clear-snapshots").addEventListener("click", function(){
  var elmSELECT = document.getElementById("revert-snapshot");
  while (elmSELECT.children.length > 0) {
    var k = elmSELECT.lastChild.textContent;
    document.cookie = k + "=; max-age=0";
    elmSELECT.removeChild(elmSELECT.lastChild);
  }
});

window.addEventListener("load", function(){
  var o = new Object;
  var ks = [];
  var elmSELECT = document.getElementById("revert-snapshot");
  var kvs = document.cookie.split(/;\s*/);
  while (kvs.length > 0) {
    var akv = kvs.pop(0);
    if (akv.length > 0) {
      var toks = akv.split("=", 2);
      var v = toks.pop();
      var k = toks.pop();
      if (k.match(/^[0-9]{14}$/)) {
        ks.push(k);
        o[k] = v;
      };
    };
  };
  ks.sort().forEach(function(k){
    var elmOption = document.createElement("option");
    elmOption.textContent = [k.substr(0,4), k.substr(4,2), k.substr(6,2)].join("/") + "-" +
                            [k.substr(8,2), k.substr(10,2), k.substr(12,2)].join(":");
    elmOption.setAttribute("data-snapshot", v);
    elmSELECT.appendChild(elmOption);
  });
  elmSELECT.selectedIndex = elmSELECT.children.length - 1;
});

document.getElementById("code-text").addEventListener("keydown",function(evt){

  // based on the sample on http://www.webclap-dandy.com/?category=Programing&id=5

  if (evt.keyCode != 9) { return; }; 
  evt.preventDefault();
  var cursorPos = evt.target.selectionStart; 
  var cursorBefore = evt.target.value.substr(0, cursorPos); 
  var cursorAfter = evt.target.value.substr(cursorPos, evt.target.value.length); 
  evt.target.value = cursorBefore + "\t" + cursorAfter;
  evt.target.selectionEnd = cursorPos + 1;
});

document.getElementById("mark-space").addEventListener("click",function(evt){
  var elmTextArea = document.getElementById("code-text");
  elmTextArea.classList.toggle("visible-space");
  if (elmTextArea.classList.contains("visible-space")) {
    evt.target.value = "stop emphasize";
  } else {
    evt.target.value = "emphasize space";
  };
});

document.querySelectorAll("input.del-last").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    var items = evt.target.parentElement.querySelectorAll("div.data-item");
    if (items.length > 0) {
      var lastItem = items[items.length - 1];
      lastItem.parentElement.removeChild(lastItem);
    };
  });
});

document.querySelectorAll("input.add-var-set").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    var elmDivParent = evt.target.parentElement;
    var cntItems = elmDivParent.querySelectorAll("div.data-item").length;

    var elmDiv = document.createElement("div");
    elmDiv.classList.add("data-item");
    elmDiv.classList.add("var-name-value-set");

    var elmInputVarName = document.createElement("input");
    elmInputVarName.setAttribute("type", "text");
    elmInputVarName.style.width = "60pt";
    elmInputVarName.value = ("v" + cntItems.toString());
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    var elmInputVarValue = document.createElement("input");
    elmInputVarValue.setAttribute("type", "text");
    elmInputVarValue.style.width = "120pt";
    elmInputVarValue.value = "3.14";
    elmDiv.appendChild(elmInputVarValue);

    elmDivParent.appendChild(elmDiv);
  });
});

document.querySelectorAll("input.add-var-get").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    var elmDivParent = evt.target.parentElement;
    var cntItems = elmDivParent.querySelectorAll("div.data-item").length;

    var elmDiv = document.createElement("div");
    elmDiv.classList.add("data-item");
    elmDiv.classList.add("var-name-value-get");
    var elmInputVarName = document.createElement("input");
    elmInputVarName.setAttribute("type", "text");
    elmInputVarName.style.width = "60pt";
    elmInputVarName.value = ("v" + cntItems.toString());
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    var elmSpanVarValue = document.createElement("span");
    elmSpanVarValue.setAttribute("type", "text");
    elmSpanVarValue.style.width = "120pt";
    elmSpanVarValue.value = "3.14";
    elmDiv.appendChild(elmSpanVarValue);

    elmDivParent.appendChild(elmDiv);
  });
});


document.querySelectorAll("input.add-csv-file").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    var elmDivParent = evt.target.parentElement;
    var cntItems = elmDivParent.querySelectorAll("div.data-item").length;

    var elmDiv = document.createElement("div");
    elmDiv.classList.add("data-item");
    elmDiv.classList.add("var-name-file");

    var elmInputVarName = document.createElement("input");
    elmInputVarName.setAttribute("type", "text");
    elmInputVarName.style.width = "60pt";
    elmInputVarName.value = ("d" + cntItems.toString());
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    var elmInputVarFile = document.createElement("input");
    elmInputVarFile.setAttribute("type", "file");
    elmDiv.appendChild(elmInputVarFile);
    elmDivParent.appendChild(elmDiv);
  });
});

let l10nButtons = function() {
  cssSelector2val = {};
  switch(window.navigator.language) {
  case "ja":
  case "ja-JP":
  default:
    cssSelector2val = {
      "div.input-data > input.add-csv-file": "csvを1つ予定追加",
      "div.input-data > input.del-last": "csvを1つ予定削除",
      "div.output-data > input.add-var-get": "変数検査を1つ追加",
      "div.output-data > input.del-last": "変数検査を1つ削除",
      "#exec": "実行",
      "#break_if_in_debugger": "デバッガなら実行直後に停止",
      "#take-snapshot": "Cookieに履歴を追加",
      "#clear-snapshots": "履歴を全て破棄",
      "#revert-snapshot": "最新の履歴を1つ破棄",
      "#download": "現状をダウンロード",
      "#download-anchor > span": "現状をダウンロード",
      "#mark-space": "空白を強調"
    };
  };
  Object.keys(cssSelector2val).forEach(function(cs){
    let msg = cssSelector2val[cs];
    let elm = document.querySelector(cs);
    if (elm) {
      switch (elm.tagName) {
      case "INPUT": elm.setAttribute("value", msg);
      case "SPAN": elm.textContent = msg;
      };
    };
  });
};
l10nButtons();
