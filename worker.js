onmessage = function(evt) {
  let result = null;

  try {
    let fnTry = new Function( evt.data );
    result = fnTry();
  } catch (err) {
    result = {};
    result.error = err.toString();
  };
  postMessage( JSON.stringify(result) );
}
