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
  var dateTimeStr = ("0000" + dt.getFullYear().toString()).slice(-4) +
                    ("00" + (dt.getMonth() + 1).toString()).slice(-2) +
                    ("00" + dt.getDate().toString()).slice(-2) +
                     "-" +
                    ("00" + dt.getHours().toString()).slice(-2) +
                    ("00" + dt.getMinutes().toString()).slice(-2) +
                     "." + 
                    ("00" + dt.getSeconds().toString()).slice(-2);

  var jsText = document.getElementById("code-text").value;
  document.cookie = dateTimeStr + "=" + encodeURIComponent(jsText);

  var elmOption = document.createElement("option");
  elmOption.textContent = dateTimeStr;
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
    var toks = kvs.pop(0).split("=", 2);
    var v = toks.pop();
    var k = toks.pop();
    if (k.match(/^[0-9]{8}-[0-9]{4}\.[0-9]{2}$/)) {
      ks.push(k);
      o[k] = v;
    };
  };
  ks.sort().forEach(function(k){
    var elmOption = document.createElement("option");
    elmOption.textContent = k;
    elmOption.setAttribute("data-snapshot", v);
    elmSELECT.appendChild(elmOption);
  });
  elmSELECT.selectedIndex = elmSELECT.children.length - 1;
});
