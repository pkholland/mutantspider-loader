module.exports.load_modules = function(submodules, callback) {

  function nacl_load(subm, callback, i) {
    var control_elem = document.createElement('div');
    var nacl_elem = document.createElement('embed');
    nacl_elem.setAttribute('src', subm.nmf_name);
    nacl_elem.setAttribute('type', 'application/x-pnacl');
    nacl_elem.setAttribute('browser_language', navigator.language );
    nacl_elem.setAttribute('ms_module_id', i);
    nacl_elem.setAttribute('local_storage', 0);	// assume failure
    if (subm.local_storage)
      navigator.webkitPersistentStorage.requestQuota(subm.local_storage,
        function(bytes) {
          nacl_elem.setAttribute('local_storage', bytes);
          control_elem.appendChild(nacl_elem);
        },
        function(err) {
          control_elem.appendChild(nacl_elem);
        });
    else
        control_elem.appendChild(nacl_elem);
    callback({module: nacl_elem, mod_id: i, submodule: subm});
  }

  submodules.forEach(function(subm, i, a){
    if (subm.type === 'nacl') {
      if (navigator.mimeTypes['application/x-pnacl']) {
        if (document.body)
          nacl_load(subm, callback, i);
        else
          document.addEventListener('DOMContentLoaded',function(event) {
            nacl_load(subm, callback, i);
          });
      }
    } else if (subm.type === 'asmjs-web-worker') {
      var isRemoteURI = (subm.asm_js_script_src.toLowerCase().indexOf('http:') === 0);
      isRemoteURI = isRemoteURI | (subm.asm_js_script_src.toLowerCase().indexOf('https:') === 0);
      var wurl = isRemoteURI ? (window.URL || window.webkitURL).createObjectURL(new Blob(["importScripts('" + subm.asm_js_script_src + "'); "])) : subm.asm_js_script_src;
      var worker = new Worker(wurl);
      callback({module: worker, mod_id: i, submodule: subm});
      worker.postMessage({api: 'MS_LaunchWorker',
                        asm_js_module_name: subm.asm_js_module_name,
                        mod_id: i,
                        browser_language: navigator.language,
                        asm_js_memory: subm.asm_js_memory});

    } else if (subm.type === 'asmjs-direct') {
      (function() {
        var script_elem = document.createElement('script');
        script_elem.type = 'text/javascript';
        script_elem.src = subm.asm_js_script_src;
        script_elem.onload = function() {
          var mod = {
            __ms_module_id__: i,
            __ms_browser_language__: navigator.language,
            TOTAL_MEMORY: subm.asm_js_memory
          };
          callback({module: mod, mod_id: i, submodule: subm});
        };
        document.head.appendChild(script_elem);
      })();
    }
  });

};
