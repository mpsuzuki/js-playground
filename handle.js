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
  // elmDownloadAnchor.setAttribute("download", "code.js");
  elmDownloadAnchor.style.display = "block";
});

// document.getElementById("download-anchor").addEventListener("click", function(evt){
//  document.getElementById("download-anchor").style.display = "none";
//  // evt.preventDefault();
// });
