onmessage = function(evt) {
  let result = {};

  try {
    let fnTry = new Function( evt.data );
    result.result = fnTry();
  } catch (err) {
    result.error = err;
  };
  postMessage( JSON.stringify(result) );
}
