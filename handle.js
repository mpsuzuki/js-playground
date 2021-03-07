document.getElementById("exec").addEventListener("click", function(){
  var dataItems = document.querySelectorAll("div.input-data > div.data-item");
  var jsDataInit = "";
  for (var i = 0; i < dataItems.length; i += 1) {
    var inputs = dataItems[i].getElementsByTagName("input");
    if (dataItems[i].classList.contains("var-name-value-set")) {
      jsDataInit += "var " + inputs[0].value;
      jsDataInit += " = ";
      jsDataInit += "\'" + inputs[1].value + "\';";
    } else
    if (inputs.classList.contains("var-name-file")) {
      jsDataInit += ("var " + inputs[0].value + " = null;");
    };
  };

  var past = document.getElementById("on-the-fly");
  if (past) {
    past.parentElement.removeChild(past);
  };
  var elmSCRIPT = document.createElement("script");
  elmSCRIPT.setAttribute("type", "text/javascript");
  elmSCRIPT.setAttribute("id", "on-the-fly");
  var jsText = document.getElementById("code-text").value;
  var jsTextNode = document.createTextNode( jsDataInit + jsText );
  elmSCRIPT.appendChild( jsTextNode );
  document.body.appendChild(elmSCRIPT);
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
    elmInputVarName.setAttribute("placeholder", "v" + cntItems.toString());
    elmInputVarName.style.textAlign = "right";
    elmInputVarName.style.width = "60pt";
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    var elmInputVarValue = document.createElement("input");
    elmInputVarValue.setAttribute("type", "text");
    elmInputVarValue.setAttribute("placeholder", "3.14");
    elmInputVarValue.style.width = "120pt";
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
    elmInputVarName.setAttribute("placeholder", "v" + cntItems.toString());
    elmInputVarName.style.textAlign = "right";
    elmInputVarName.style.width = "60pt";
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    var elmSpanVarValue = document.createElement("span");
    elmSpanVarValue.setAttribute("type", "text");
    elmSpanVarValue.setAttribute("placeholder", "3.14");
    elmSpanVarValue.style.width = "120pt";
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
    elmInputVarName.setAttribute("placeholder", "v" + cntItems.toString());
    elmInputVarName.style.textAlign = "right";
    elmInputVarName.style.width = "60pt";
    elmDiv.appendChild(elmInputVarName);

    elmDiv.appendChild(document.createTextNode("="));

    var elmInputVarFile = document.createElement("input");
    elmInputVarFile.setAttribute("type", "file");
    elmDiv.appendChild(elmInputVarFile);
    elmDivParent.appendChild(elmDiv);
  });
});
