const BASE_URL = "https://lacatruyen.online";

function absoluteUrl(url) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

function parseNextData(doc) {
    var data = doc.select("#__NEXT_DATA__").first();
    if (!data) return null;
    try {
        return JSON.parse(data.html());
    } catch (e) {
        return null;
    }
}
