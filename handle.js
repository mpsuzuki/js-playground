document.getElementById("exec").addEventListener("click", function(){
  var past = document.getElementById("on-the-fly");
  if (past) {
    past.parentElement.removeChild(past);
  };
  var elmSCRIPT = document.createElement("script");
  elmSCRIPT.setAttribute("type", "text/javascript");
  elmSCRIPT.setAttribute("id", "on-the-fly");
  var jsText = document.getElementById("code-text").value;
  var jsTextNode = document.createTextNode( jsText );
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

document.getElementById("del-input-last").addEventListener("click",function(evt){
  var items = document.querySelectorAll("#input-data > div.input-item");
  if (items.length > 0) {
    var lastItem = items[items.length - 1];
    lastItem.parentElement.removeChild(lastItem);
  };
});

document.getElementById("add-input-var").addEventListener("click",function(evt){
  var elmDivInputData = document.getElementById("input-data");
  var cntItems = elmDivInputData.querySelectorAll("#input-data > div.input-item").length;

  var elmDiv = document.createElement("div");
  elmDiv.classList.add("input-item");
  elmDiv.classList.add("var-name-value");
  var elmInputVarName = document.createElement("input");
  var elmInputVarValue = document.createElement("input");
  elmInputVarName.setAttribute("type", "text");
  elmInputVarValue.setAttribute("type", "text");
  elmInputVarName.setAttribute("placeholder", "v" + cntItems.toString());
  elmInputVarValue.setAttribute("placeholder", "3.14");
  elmInputVarName.style.textAlign = "right";
  elmInputVarName.style.width = "60pt";
  elmInputVarValue.style.width = "120pt";
  elmDiv.appendChild(elmInputVarName);
  elmDiv.appendChild(document.createTextNode("="));
  elmDiv.appendChild(elmInputVarValue);
  elmDivInputData.appendChild(elmDiv);
});

document.getElementById("add-input-csv-file").addEventListener("click",function(evt){
  var elmDivInputData = document.getElementById("input-data");
  var cntItems = elmDivInputData.querySelectorAll("#input-data > div.input-item").length;

  var elmDiv = document.createElement("div");
  elmDiv.classList.add("input-item");
  elmDiv.classList.add("var-name-file");
  var elmInputVarName = document.createElement("input");
  var elmInputVarFile = document.createElement("input");
  elmInputVarName.setAttribute("type", "text");
  elmInputVarFile.setAttribute("type", "file");
  elmInputVarName.setAttribute("placeholder", "v" + cntItems.toString());
  elmInputVarName.style.textAlign = "right";
  elmInputVarName.style.width = "60pt";
  elmDiv.appendChild(elmInputVarName);
  elmDiv.appendChild(document.createTextNode("="));
  elmDiv.appendChild(elmInputVarFile);
  elmDivInputData.appendChild(elmDiv);
});
