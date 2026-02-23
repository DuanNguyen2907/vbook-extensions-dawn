const BASE_URL = "https://lacatruyen.online";

const DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
    "Referer": BASE_URL + "/"
};

function getDoc(url) {
    try {
        return Http.get(url).headers(DEFAULT_HEADERS).html();
    } catch (e) {
        return Http.get(url).html();
    }
}

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
