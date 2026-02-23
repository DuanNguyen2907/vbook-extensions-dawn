load('config.js');
load('crypto.js');

const APP_KEY_SEED = "G5sA7dL2K9fV3hQ1Zr8wX6pR0jN4uYtM7iC3vB9oS6xE2qLK-mKasbbZ";

function getAppCryptoKey() {
    var parts = APP_KEY_SEED.split("-");
    var left = parts[0] || "";
    var right = parts[1] || "";

    var shift = 0;
    for (var i = 0; i < right.length; i++) {
        shift += right.charCodeAt(i);
    }

    var output = "";
    for (var j = 0; j < left.length; j++) {
        var code = left.charCodeAt(j);
        output += String.fromCharCode((code - 65 + shift) % 26 + 65);
    }
    return output;
}

function decryptWithKey(value, key) {
    try {
        if (!value || !key) return "";
        return CryptoJS.AES.decrypt(value, key).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return "";
    }
}

function decrypt(value) {
    return decryptWithKey(value, getAppCryptoKey());
}

function decryptObject(obj) {
    var output = {};
    if (!obj) return output;

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            output[key] = decrypt(obj[key]);
        }
    }

    return output;
}

function looksLikeHtml(text) {
    if (!text) return false;
    return /<p[\s>]/i.test(text) || /<br\s*\/?\s*>/i.test(text) || /<div[\s>]/i.test(text);
}

function tryDecryptContent(chapter, baseKey) {
    var targets = [chapter.content, chapter.content_comp, chapter.chapter_content, chapter.content_html];
    for (var i = 0; i < targets.length; i++) {
        var val = decryptWithKey(targets[i], baseKey);
        if (val && val.trim()) {
            return val;
        }
    }
    return "";
}

function extractChapterContent(pageProps) {
    var chapter = pageProps ? (pageProps.chapter || {}) : {};
    var rs = pageProps ? pageProps.rs : null;
    var ri = pageProps ? pageProps.ri : null;
    var commentRaw = pageProps ? pageProps.comment_count : null;

    if (chapter.key_encrypt && rs && ri) {
        var decryptedRs = decryptObject(rs);
        var indexKey = decrypt(ri);

        var rsCandidates = [];
        if (decryptedRs[indexKey]) rsCandidates.push(decryptedRs[indexKey]);
        if (decryptedRs["0"]) rsCandidates.push(decryptedRs["0"]);

        var firstKey = Object.keys(decryptedRs)[0];
        if (firstKey && decryptedRs[firstKey]) rsCandidates.push(decryptedRs[firstKey]);

        rsCandidates.push("undefined");

        var commentCandidates = [];
        if (commentRaw != null) {
            commentCandidates.push(commentRaw);
            try {
                commentCandidates.push(JSON.stringify(commentRaw));
            } catch (e) { }
            if (Array.isArray(commentRaw) && commentRaw.length) {
                commentCandidates.push(commentRaw[0].count || 0);
            }
        }
        commentCandidates.push(0);

        for (var i = 0; i < rsCandidates.length; i++) {
            for (var j = 0; j < commentCandidates.length; j++) {
                var dynamicKey = decryptWithKey(chapter.key_encrypt, "" + (rsCandidates[i] + commentCandidates[j]));
                if (!dynamicKey) continue;

                var content = tryDecryptContent(chapter, dynamicKey);
                if (content && content.trim()) {
                    return content;
                }
            }
        }
    }

    var plain = chapter.content || chapter.chapter_content || chapter.content_html || chapter.content_comp || "";
    if (plain && !/^U2FsdGVkX1/.test(plain)) {
        return plain;
    }

    return "";
}

function execute(url) {
    var fixedUrl = absoluteUrl(url).replace(/\/$/, "");
    var doc = getDoc(fixedUrl);
    var nextData = parseNextData(doc);

    var pageProps = nextData && nextData.props ? nextData.props.pageProps : null;
    var content = extractChapterContent(pageProps);

    if (!content) {
        content = doc.select("#chapter-content").html()
            || doc.select(".chapter-content").html()
            || doc.select(".content-wrap").html()
            || doc.select(".entry-content").html()
            || "";
    }

    if (!content) {
        return Response.error("Không thể đọc nội dung chương: " + fixedUrl);
    }

    content = content
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/\u00a0/g, " ")
        .trim();

    if (!looksLikeHtml(content)) {
        content = "<p>" + content.replace(/\n+/g, "</p><p>") + "</p>";
    }

    var nextUrl = "";
    var chapterRight = pageProps ? pageProps.chapterRight : null;
    if (chapterRight && chapterRight.slug) {
        nextUrl = BASE_URL + "/chapter/" + chapterRight.slug;
    }

    if (!nextUrl) {
        nextUrl = doc.select("a[rel=next]").attr("href")
            || doc.select("a.next").attr("href")
            || "";
    }

    return Response.success(content, absoluteUrl(nextUrl));
}
