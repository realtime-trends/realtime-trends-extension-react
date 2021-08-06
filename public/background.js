const engineCandidates = ["naver", "google", "daum", "zum", "nate"];
// const SERVER_URL = "http://localhost:5000"
const SERVER_URL = "https://realtime-trends.herokuapp.com"

const getUserId = () => {
    let user_id = localStorage.getItem("user_id");
    if (user_id === null) {
      user_id = Math.random().toString(36).substr(2,11);
      localStorage.setItem("user_id", user_id)
    }
    return user_id;
}

window.onload = function(){
    var url = new URL(document.location.href);
    var hostname = "";
    let domainNames = url.hostname.split(".");
    for (var domainName of domainNames) {
        if (engineCandidates.includes(domainName)) {
        hostname = domainName;
        break;
        }
    }
    if (hostname === "daum" && url.pathname === "/nate") {
        hostname = "nate";
    }
    let user_id = getUserId();
    var query_params = url.search + "&user_id=" + user_id + "&engine=" + hostname;

    if (engineCandidates.includes(hostname)) {
        var req = new XMLHttpRequest();
        req.open("GET", SERVER_URL + "/api/search" + query_params, true);
        req.send(null);
        req.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                // console.log("Got response 200!");
            }
        }
    }
}