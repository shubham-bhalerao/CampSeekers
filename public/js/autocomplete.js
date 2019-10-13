var availableTags = [];
for (let i = 0; i < campgrounds.length; i++) {
    if (!(availableTags.indexOf(campgrounds[i].title) > -1)) {
        availableTags.push(campgrounds[i].title);
    }
    if (!(availableTags.indexOf(campgrounds[i].author.username) > -1)) {
        availableTags.push(campgrounds[i].author.username);
    }
    if (!(availableTags.indexOf(campgrounds[i].location) > -1)) {
        availableTags.push(campgrounds[i].location);
    }
}
$(function () {
    $("#tags").autocomplete({
        source: availableTags
    });
});