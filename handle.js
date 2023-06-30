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

let isSymbolicValue = function(s) {
  if (s == "true" || s == "false") {
    return true;
  };
  if (s == "null" || s == "undefined" || s == "NaN") {
    return true;
  };
  return false;
}

let isQuotedString = function(s) {
  if ((s.substr(0,1) == "'") && (s.substr(-1,1) == "'"))
    return 1;
  if ((s.substr(0,1) == '"') && (s.substr(-1,1) == '"'))
    return 2;
  return 0;
}

let getDateTimeStr = function() {
  let dt = new Date();
  let k = ("0000" + dt.getFullYear().toString()).slice(-4) +
          ("00" + (dt.getMonth() + 1).toString()).slice(-2) +
          ("00" + dt.getDate().toString()).slice(-2) +
          ("00" + dt.getHours().toString()).slice(-2) +
          ("00" + dt.getMinutes().toString()).slice(-2) +
          ("00" + dt.getSeconds().toString()).slice(-2);
  return k;
};

document.getElementById("exec").addEventListener("click", function(){
  let past = document.getElementById("on-the-fly");
  if (past) {
    past.parentElement.removeChild(past);
  };

  let dataItems = document.querySelectorAll("div.input-data > div.data-item");
  let jsDataPromises = [];
  let jsDataInits = [];

  let checkVariableNameSyntax = function(s) {
    return /^[A-Za-z_][0-9A-Za-z_]*/.test(s);
  };

  /* to preserve the sequence of the file loading, the index i should be cared */
  let enqueFileReader = function(varName, csvFile, jsDataInits, i) {
    let promise = new Promise(function(fnResolve, fnReject) {
      let fr = new FileReader();
      fr.onload = function(evt) {
        let csvData = []; /* temporal array variable to load CSV file */
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
              return (Number.isNaN(t) || t == null || t == undefined || t.length == 0);
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

  for (let i = 0; i < dataItems.length; i += 1) {
    let inputs = dataItems[i].getElementsByTagName("input");
    let radio  = dataItems[i].querySelector("input.value-type-radio:checked");

    if (!checkVariableNameSyntax(inputs[0].value)) {
      inputs[0].style.backgroundColor = "pink";
      return;
    } else {
      inputs[0].style.backgroundColor = null;
    };

    /* simple variable-value pair */
    if (dataItems[i].classList.contains("var-name-value-set")) {
      let v = inputs[1].value.trim();
      jsDataInits[i]  = "let " + inputs[0].value;
      jsDataInits[i] += " = ";
      if (radio.value == "string") {
        if (!v.includes("'")) {
          jsDataInits[i] += "'" + v + "' ;";
        } else
        if (!v.includes('"')) {
          jsDataInits[i] += '"' + v + '" ;';
        } else
        if (!v.includes("`")) {
          jsDataInits[i] += "`" + v + "` ;";
        } else
          jsDataInits[i] += v + " ;";
      } else {
        jsDataInits[i] += v.trim() + ";";
      }
    } else
    /* CSV file loader */
    if (dataItems[i].classList.contains("var-name-file")) {
      let varName = inputs[0].value;
      let csvFile = inputs[1].files[0];
      let promise = enqueFileReader (varName, csvFile, jsDataInits, i);
      jsDataPromises.push(promise);
    };
  };

  let execJS = function() {
    let jsTextBody = document.getElementById("code-text").value;

    let dataItems = document.querySelectorAll("div.output-data > div.data-item");
    let jsTextPost = "\n\n/* postfix to inspect variables */\n"
    jsTextPost += "{\n";
    jsTextPost += '  let v2s = function(v){if(typeof(v)==="undefined"){return "undefined variable"}else{return v}};\n';
    jsTextPost += "  let spans = document.querySelectorAll('div.output-data > div.data-item > span');";
    for (let i = 0; i < dataItems.length; i += 1) {
      let input = dataItems[i].getElementsByTagName("input")[0];
      let span = dataItems[i].getElementsByTagName("span")[0];
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

    let jsTextPre = "if (document.getElementById('break-before-exec').checked) { debugger };\n";
    jsTextPre += jsDataInits.join(";\n");
    jsTextPre += "/* JavaScript code in textarea */ {\n";
    jsTextPre += "};\n";

    try {
      let fnTry = new Function(jsTextPre + jsTextBody + jsTextPost);
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

document.getElementById("download-anchor").addEventListener("click", function(){
  let jsText = document.getElementById("code-text").value;
  let blob = new Blob([jsText], {type: "application/octet-stream"});
  let dataURL = URL.createObjectURL(blob);
  let elmDownloadAnchor = document.getElementById("download-anchor");
  let dateTimeStr = getDateTimeStr();
  elmDownloadAnchor.setAttribute("type", "application/octet-stream");
  elmDownloadAnchor.setAttribute("href", dataURL);
  elmDownloadAnchor.setAttribute("download", "js-code-" + dateTimeStr + ".txt");
  elmDownloadAnchor.style.display = "inline-block";
});

document.getElementById("take-snapshot").addEventListener("click", function(){
  let k = getDateTimeStr();
  let jsText = document.getElementById("code-text").value;
  document.cookie = k + "=" + encodeURIComponent(jsText);

  let elmOption = document.createElement("option");
  elmOption.textContent = [k.substr(0,4), k.substr(4,2), k.substr(6,2)].join("/") + "-" +
                          [k.substr(8,2), k.substr(10,2), k.substr(12,2)].join(":");
  elmOption.setAttribute("data-snapshot", encodeURIComponent(jsText));

  let elmSELECT = document.getElementById("revert-snapshot");
  elmSELECT.appendChild(elmOption);
  elmSELECT.selectedIndex = elmSELECT.children.length - 1;
});

document.getElementById("revert-snapshot").addEventListener("change", function(){
  let pastJsTextEsc = document.getElementById("revert-snapshot").selectedOptions[0].getAttribute("data-snapshot");
  document.getElementById("code-text").value = decodeURIComponent(pastJsTextEsc);
});

document.getElementById("clear-snapshots").addEventListener("click", function(){
  let elmSELECT = document.getElementById("revert-snapshot");
  while (elmSELECT.children.length > 0) {
    let k = elmSELECT.lastChild.textContent;
    document.cookie = k + "=; max-age=0";
    elmSELECT.removeChild(elmSELECT.lastChild);
  }
});

window.addEventListener("load", function(){
  let o = new Object;
  let ks = [];
  let elmSELECT = document.getElementById("revert-snapshot");
  let kvs = document.cookie.split(/;\s*/);
  while (kvs.length > 0) {
    let akv = kvs.pop(0);
    if (akv.length > 0) {
      let toks = akv.split("=", 2);
      let v = toks.pop();
      let k = toks.pop();
      if (k.match(/^[0-9]{14}$/)) {
        ks.push(k);
        o[k] = v;
      };
    };
  };
  ks.sort().forEach(function(k){
    let elmOption = document.createElement("option");
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
  let cursorPos = evt.target.selectionStart;
  let cursorBefore = evt.target.value.substr(0, cursorPos);
  let cursorAfter = evt.target.value.substr(cursorPos, evt.target.value.length); 
  evt.target.value = cursorBefore + "\t" + cursorAfter;
  evt.target.selectionEnd = cursorPos + 1;
});

document.getElementById("mark-space").addEventListener("click",function(evt){
  let elmTextArea = document.getElementById("code-text");
  elmTextArea.classList.toggle("visible-space");
  elmTextArea.previousElementSibling.classList.toggle("visible-space");
  evt.currentTarget.classList.toggle("pushed");
  evt.currentTarget.querySelector("span").classList.toggle("content-data-on");
});

document.querySelectorAll("*.del-last").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    let items = evt.currentTarget.parentElement.querySelectorAll("div.data-item");
    if (items.length > 0) {
      let lastItem = items[items.length - 1];
      lastItem.parentElement.removeChild(lastItem);
    };
  });
});

let updateVarValueSetterType = function(evt) {
  let elmRadioButton = evt.currentTarget;
  if (elmRadioButton.checked) {
    let valType = elmRadioButton.value;
    let elmInputVarValue = elmRadioButton.parentElement.querySelector("input.var-set");
    let valTypeOld = elmInputVarValue.getAttribute("data-value-type");
    let valOld = elmInputVarValue.value;
    elmInputVarValue.setAttribute("data-value-type", valType);
    if (valType == "number") {
      elmInputVarValue.setAttribute("type", "number");
      elmInputVarValue.setAttribute("step", "any");
      if (isInt(valOld)) {
        elmInputVarValue.value = parseInt(valOld);
      } else if (isFloat(valOld)) {
        elmInputVarValue.value = parseFloat(valOld);
      } else {
        elmInputVarValue.value = "";
      }
    } else if (valType == "js" && valTypeOld == "string") {
      elmInputVarValue.setAttribute("type", "text");
      elmInputVarValue.removeAttribute("step");
      elmInputVarValue.value = '"' + valOld + '"';
    } else if (valType == "string" && valTypeOld == "number") {
      elmInputVarValue.setAttribute("type", "text");
      elmInputVarValue.removeAttribute("step");
      elmInputVarValue.value = valOld;
    } else if (valType == "string" && valTypeOld == "js") {
      elmInputVarValue.setAttribute("type", "text");
      elmInputVarValue.removeAttribute("step");
      if (isQuotedString(valOld)) {
        valOld = valOld.trim();
        elmInputVarValue.value = valOld.substr(1,valOld.length - 2);
      } else {
        elmInputVarValue.value = valOld;
      }
    } else {
      elmInputVarValue.setAttribute("type", "text");
      elmInputVarValue.removeAttribute("step");
    }
  };
};

document.querySelectorAll("*.add-var-set").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    let elmDivParent = evt.currentTarget.parentElement;
    let cntItems = elmDivParent.querySelectorAll("div.data-item").length;

    let elmDiv = document.createElement("div");
    elmDiv.classList.add("data-item");
    elmDiv.classList.add("var-name-value-set");

    let elmInputVarName = document.createElement("input");
    elmInputVarName.setAttribute("type", "text");
    elmInputVarName.style.width = "60pt";
    elmInputVarName.value = ("v" + cntItems.toString());
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    let elmInputVarValue = document.createElement("input");
    elmInputVarValue.classList.add("var-set");
    elmInputVarValue.setAttribute("type", "text");
    elmInputVarValue.setAttribute("data-value-type", "js");
    elmInputVarValue.style.width = "120pt";
    elmInputVarValue.value = "3.14";
    elmDiv.appendChild(elmInputVarValue);

    elmDiv.appendChild(document.createTextNode("\n"));

    let nmRadioGroup = "value-type-of-" + elmInputVarName.value;
    let elmRadioButton;
    elmRadioButton = document.createElement("input");
    elmRadioButton.classList.add("value-type-radio");
    elmRadioButton.setAttribute("type", "radio");
    elmRadioButton.setAttribute("name", nmRadioGroup);
    elmRadioButton.value = "js";
    elmRadioButton.checked = true;
    elmRadioButton.addEventListener("change", updateVarValueSetterType);
    elmDiv.appendChild(elmRadioButton);
    elmDiv.appendChild(document.createTextNode(elmRadioButton.value + " "));

    elmRadioButton = document.createElement("input");
    elmRadioButton.classList.add("value-type-radio");
    elmRadioButton.setAttribute("type", "radio");
    elmRadioButton.setAttribute("name", nmRadioGroup);
    elmRadioButton.value = "number";
    elmRadioButton.addEventListener("change", updateVarValueSetterType);
    elmDiv.appendChild(elmRadioButton);
    elmDiv.appendChild(document.createTextNode(elmRadioButton.value + " "));

    elmRadioButton = document.createElement("input");
    elmRadioButton.classList.add("value-type-radio");
    elmRadioButton.setAttribute("type", "radio");
    elmRadioButton.setAttribute("name", nmRadioGroup);
    elmRadioButton.value = "string";
    elmRadioButton.addEventListener("change", updateVarValueSetterType);
    elmDiv.appendChild(elmRadioButton);
    elmDiv.appendChild(document.createTextNode(elmRadioButton.value + " "));

    elmDivParent.appendChild(elmDiv);
  });
});

document.querySelectorAll("input.value-type-radio").forEach(function(elm){
  elm.addEventListener("change", updateVarValueSetterType);
});

document.querySelectorAll("*.add-var-get").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    let elmDivParent = evt.currentTarget.parentElement;
    let cntItems = elmDivParent.querySelectorAll("div.data-item").length;

    let elmDiv = document.createElement("div");
    elmDiv.classList.add("data-item");
    elmDiv.classList.add("var-name-value-get");
    let elmInputVarName = document.createElement("input");
    elmInputVarName.setAttribute("type", "text");
    elmInputVarName.style.width = "60pt";
    elmInputVarName.value = ("v" + cntItems.toString());
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    let elmSpanVarValue = document.createElement("span");
    elmSpanVarValue.setAttribute("type", "text");
    elmSpanVarValue.style.width = "120pt";
    elmSpanVarValue.value = "3.14";
    elmDiv.appendChild(elmSpanVarValue);

    elmDivParent.appendChild(elmDiv);
  });
});


document.querySelectorAll("*.add-csv-file").forEach(function(elm){
  elm.addEventListener("click",function(evt){
    let elmDivParent = evt.currentTarget.parentElement;
    let cntItems = elmDivParent.querySelectorAll("div.data-item").length;

    let elmDiv = document.createElement("div");
    elmDiv.classList.add("data-item");
    elmDiv.classList.add("var-name-file");

    let elmInputVarName = document.createElement("input");
    elmInputVarName.setAttribute("type", "text");
    elmInputVarName.style.width = "60pt";
    elmInputVarName.value = ("d" + cntItems.toString());
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    let elmInputVarFile = document.createElement("input");
    elmInputVarFile.setAttribute("type", "file");
    elmDiv.appendChild(elmInputVarFile);
    elmDivParent.appendChild(elmDiv);
  });
});

let l10nButtons = function() {
  let cssSelector2val = {};
  switch(window.navigator.language) {
  case "ja":
  case "ja-JP":
  default:
    cssSelector2val = {
      "div.input-data > a.add-csv-file > span": "入力用のCSVファイルを追加",
      "div.input-data > a.add-var-set > span": "初期設定変数を追加",
      "div.input-data > a.del-last > span": "最後のひとつを削除",
      "div.output-data > a.add-var-get > span": "表示する変数を追加",
      "div.output-data > a.del-last > span": "最後のひとつを削除",
      "#exec > span": "実行",
      "#break_if_in_debugger": "デバッガなら実行直後に停止",
      "#take-snapshot": "スナップショット保存",
      "#clear-snapshots": "スナップショットを全て削除",
      "#revert-snapshot": "スナップショットに戻る",
      "#download": "プログラムをダウンロード",
      "#download-anchor > span": "プログラムをダウンロード",
      "#note-mark-space": { "data-on": "空白文字の強調を解除する", "data-off": "空白文字を目立たせる" }
    };
  };
  Object.keys(cssSelector2val).forEach(function(cs){
    let msg = cssSelector2val[cs];
    let elm = document.querySelector(cs);
    if (elm) {
      switch (typeof(msg)) {
      case "string":
        switch (elm.tagName) {
        case "INPUT": elm.setAttribute("value", msg);
        case "SPAN": elm.textContent = msg;
        };
        break;
      case "object":
        Object.keys(msg).forEach(function(k){
          elm.setAttribute(k, msg[k]);
        });
        break;
      };
    };
  });
};
l10nButtons();

$("#code-text").highlightWithinTextarea({highlight: /[^\x00-\x7F]+/g, className: "red"});
let wnjs = document.getElementById("#warn-no-js");
wnjs.parentElement.removeChild(wnjs);
