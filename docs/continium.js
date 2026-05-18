!function () {
  var appUrl = "https://app.continium.com"; // use PUBLIC_URL if you are using multi-domain setup, otherwise use WEBAPP_URL
  var environmentId = "clgwcwp4z000lpf0hur7pzbuv";

  var t = document.createElement("script");
  t.type = "text/javascript";
  t.async = !0;
  t.src = appUrl + "/js/continium.umd.cjs";

  var e = document.getElementsByTagName("script")[0];
  e.parentNode.insertBefore(t, e);

  setTimeout(function () {
    window.continium.setup({ environmentId: environmentId, appUrl: appUrl });
  }, 500);
}();