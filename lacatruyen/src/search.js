load('config.js');

function execute(key, page) {
    var url = page || (BASE_URL + "/search?s=" + encodeURIComponent(key || ""));
    var doc = Http.get(url).html();

    var anchors = doc.select('a[href^="/story/"],a[href*="lacatruyen.online/story/"]');
    var data = [];
    var seen = {};

    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var href = a.attr("href");
        if (!href) continue;

        var link = absoluteUrl(href).replace(/\/$/, "");
        if (seen[link]) continue;

        var name = a.text().trim();
        if (!name) continue;

        var card = a.parent();
        var cover = "";
        var description = "";
        if (card) {
            cover = card.select("img").first() ? card.select("img").first().attr("src") : "";
            description = card.select("p").first() ? card.select("p").first().text() : "";
        }

        seen[link] = true;
        data.push({
            name: name,
            link: link,
            cover: absoluteUrl(cover),
            description: description,
            host: BASE_URL
        });
    }

    var next = doc.select('a[rel="next"]').attr("href");
    if (!next) {
        next = doc.select("a").filter(function (idx, e) {
            return e.text().trim() === ">" || e.text().trim() === "Next";
        }).attr("href");
    }

    return Response.success(data, absoluteUrl(next));
}
