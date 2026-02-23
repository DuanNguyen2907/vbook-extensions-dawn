load('config.js');

function execute(url, page) {
    var doc = getDoc(page || url);
    var anchors = doc.select('a[href^="/story/"],a[href*="lacatruyen.online/story/"]');

    var data = [];
    var seen = {};
    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var href = a.attr("href");
        var name = a.text().trim();
        if (!href || !name) continue;

        var link = absoluteUrl(href).replace(/\/$/, "");
        if (seen[link]) continue;
        seen[link] = true;

        var container = a.parent();
        var cover = "";
        var description = "";
        if (container) {
            cover = container.select("img").first() ? container.select("img").first().attr("src") : "";
            description = container.select("p").first() ? container.select("p").first().text() : "";
        }

        data.push({
            name: name,
            link: link,
            cover: absoluteUrl(cover),
            description: description,
            host: BASE_URL
        });
    }

    return Response.success(data);
}
