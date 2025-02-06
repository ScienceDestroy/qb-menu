let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const menuContainer = document.getElementById('menu-container');
const menuHeader = document.getElementById('menu-header');
const menuContent = document.getElementById('menu-content');
const closeButton = document.getElementById('close-menu');

menuHeader.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === menuHeader || e.target.parentElement === menuHeader) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, menuContainer);
    }
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

function closeMenuUI() {
    fetch(`https://${GetParentResourceName()}/closeMenu`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }).then(() => {
        menuContainer.classList.add('hidden');
        menuContent.innerHTML = '';
    });
}

function createMenuItem(item, index) {
    const menuItem = document.createElement('div');
    menuItem.className = `menu-item ${item.isMenuHeader ? 'header' : ''} ${item.disabled ? 'disabled' : ''}`;
    
    let iconHtml = '';
    if (item.icon) {
        if (item.icon.startsWith('fa-')) {
            iconHtml = `<i class="fas ${item.icon}"></i>`;
        } else if (item.icon.startsWith('http') || item.icon.startsWith('nui://')) {
            iconHtml = `<img src="${item.icon}" alt="" class="menu-item-image">`;
        }
    }
    
    menuItem.innerHTML = `
        ${iconHtml ? `<div class="menu-item-icon">${iconHtml}</div>` : ''}
        <div class="menu-item-text">
            <div>${item.header || ''}</div>
            ${item.txt ? `<div class="menu-item-description">${item.txt}</div>` : ''}
        </div>
    `;
    
    if (!item.isMenuHeader && !item.disabled) {
        menuItem.addEventListener('click', () => {
            fetch(`https://${GetParentResourceName()}/clickedButton`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: item
                })
            });
        });
    }
    
    return menuItem;
}

closeButton.addEventListener('click', closeMenuUI);

window.addEventListener('message', (event) => {
    const data = event.data;

    switch (data.action) {
        case 'OPEN_MENU':
            menuContainer.classList.remove('hidden');
            const firstItem = data.data[0];
            document.getElementById('menu-title').textContent = 
                firstItem && firstItem.isMenuHeader ? firstItem.header : 'Menu';
            
            menuContent.innerHTML = '';
            data.data.forEach((item, index) => {
                if (!item.hidden) {
                    menuContent.appendChild(createMenuItem(item, index));
                }
            });
            
            xOffset = 0;
            yOffset = 0;
            setTranslate(0, 0, menuContainer);
            break;

        case 'SHOW_HEADER':
            menuContainer.classList.remove('hidden');
            const headerItem = data.data[0];
            document.getElementById('menu-title').textContent = 
                headerItem && headerItem.header ? headerItem.header : 'Header';
            
            menuContent.innerHTML = '';
            data.data.forEach((item, index) => {
                if (!item.hidden) {
                    menuContent.appendChild(createMenuItem(item, index));
                }
            });
            
            xOffset = 0;
            yOffset = 0;
            setTranslate(0, 0, menuContainer);
            break;

        case 'CLOSE_MENU':
            menuContainer.classList.add('hidden');
            menuContent.innerHTML = '';
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
        closeMenuUI();
    }
});