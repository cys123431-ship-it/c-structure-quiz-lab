const progressUrl = new URL("./progress.html", window.location.href);
progressUrl.search = window.location.search;
progressUrl.hash = window.location.hash;

window.location.replace(progressUrl.href);
