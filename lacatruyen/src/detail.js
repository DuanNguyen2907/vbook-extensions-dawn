load('config.js');

function execute(url) {
    var fixedUrl = absoluteUrl(url).replace(/\/$/, "");
    var doc = Http.get(fixedUrl).html();
    var nextData = parseNextData(doc);

    if (!nextData || !nextData.props || !nextData.props.pageProps) {
        return Response.error("Không thể đọc dữ liệu truyện từ Lacatruyen");
    }

    var pageProps = nextData.props.pageProps;
    var story = pageProps.story || {};
    var category = story.name_category ? "Thể loại: " + story.name_category : "";
    var totalChapter = story.count_chapter ? "Số chương: " + story.count_chapter : "";
    var detail = [category, totalChapter].filter(function (e) { return !!e; }).join("<br>");

    return Response.success({
        name: story.title || doc.select("title").text(),
        cover: absoluteUrl(story.image ? ("/images/story/" + story.image) : ""),
        author: story.pen_name_user || story.user_pen_name || story.author || "",
        description: story.description || "",
        detail: detail,
        host: BASE_URL,
        ongoing: story.status !== "completed"
    });
}
