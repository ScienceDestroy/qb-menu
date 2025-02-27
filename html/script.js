let buttonParams = [];
let images = [];

const openMenu = (data = null) => {
    let html = "";
    data.forEach((item, index) => {
        if(!item.hidden) {
            let header = item.header;
            let message = item.txt || item.text;
            let isMenuHeader = item.isMenuHeader;
            let isDisabled = item.disabled;
            let icon = item.icon;
            images[index] = item;
            html += getButtonRender(header, message, index, isMenuHeader, isDisabled, icon);
            if (item.params) buttonParams[index] = item.params;
        }
    });

    $("#buttons").html(html);
    $('body').css('display' , 'inline');
    $("#menu-container").show();

    // Initialize draggable
    $("#menu-container").draggable({
        handle: "#menu-header",
        containment: "window",
        start: function() {
            $(this).css('transform', 'none');
        }
    });

    $('.menu-item').click(function() {
        const target = $(this)
        if (!target.hasClass('header') && !target.hasClass('disabled')) {
            postData(target.attr('id'));
        }
    });

    // Close button handler
    $('#close-menu').click(function() {
        cancelMenu();
    });
};

const getButtonRender = (header, message = null, id, isMenuHeader, isDisabled, icon) => {
    return `
        <div class="menu-item ${isMenuHeader ? "header" : ""} ${isDisabled ? "disabled" : ""}" id="${id}">
            <div class="menu-item-icon">
                ${icon ? `
                    <img src="${icon}" class="menu-item-image" onerror="this.onerror=null; this.remove();">
                    <i class="${icon}" onerror="this.onerror=null; this.remove();"></i>
                ` : ''}
            </div>
            <div class="menu-item-text">
                <div>${header}</div>
                ${message ? `<div class="menu-item-description">${message}</div>` : ""}
            </div>
        </div>
    `;
};

const closeMenu = () => {
    $("#buttons").html("");
    $("#menu-container").hide();
    buttonParams = [];
    images = [];
};

const postData = (id) => {
    $.post(`https://${GetParentResourceName()}/clickedButton`, JSON.stringify(parseInt(id) + 1));
    return closeMenu();
};

const cancelMenu = () => {
    $.post(`https://${GetParentResourceName()}/closeMenu`);
    return closeMenu();
};

window.addEventListener("message", (event) => {
    const data = event.data;
    const buttons = data.data;
    const action = data.action;
    switch (action) {
        case "OPEN_MENU":
        case "SHOW_HEADER":
            return openMenu(buttons);
        case "CLOSE_MENU":
            return closeMenu();
        default:
            return;
    }
});

document.onkeyup = function (event) {
    const charCode = event.key;
    if (charCode == "Escape") {
        cancelMenu();
    }
};