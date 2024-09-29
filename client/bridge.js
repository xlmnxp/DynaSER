const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'initial') {
        document.getElementById('dynaser-app').innerHTML = data.content;

        // Update the document title and base URL
        document.title = document.getElementById('dynaser-app').querySelector('title').innerText;
    } else if (data.type === 'mutation') {
        const targetSelector = data.selector.replace(
            'html>body', 'html>body>div'
        );

        const target = document.querySelector(targetSelector);
        if (target) {
            data.addedNodes.forEach(node => {
                target.insertAdjacentHTML('beforeend', node);
            });
            data.removedNodes.forEach(node => {
                const element = document.querySelector(`${targetSelector} > ${node.tagName}`);
                if (element) element.remove();
            });

            if (data.attribute.name === 'value') {
                target.value = data.attribute.value;
            } else {
                target.setAttribute(data.attribute.name, data.attribute.value);
            }
        }
    } else if (data.type === 'event') {
        // Handle server-side events on the client
        console.log('Server event:', data);
    }
};

function generateSelector(context) {
    let index, pathSelector;

    // call getIndex function
    index = getIndex(context);

    while (context.tagName) {
        // selector path
        pathSelector = context.localName + (pathSelector ? ">" + pathSelector : "");
        context = context.parentNode;
    }
    // selector path for nth of type
    pathSelector = pathSelector + `:nth-of-type(${index})`;
    return pathSelector;
}

// get index for nth of type element
function getIndex(node) {
    let i = 1;
    let tagName = node.tagName;

    while (node.previousSibling) {
        node = node.previousSibling;
        if (
            node.nodeType === 1 &&
            tagName.toLowerCase() == node.tagName.toLowerCase()
        ) {
            i++;
        }
    }
    return i;
}

function getSelection(target) {
    let selector = generateSelector(target);
    selector = selector.replace('html>body>div', 'html>body');
    return selector;
}

// Function to send event data to the server
function sendEventToServer(eventType, event) {
    ws.send(JSON.stringify({
        type: 'event',
        eventType: eventType,
        selector: getSelection(event.target),
        value: event.target.value
    }));
}

// List of events to listen for
const events = [
    'click', 'dblclick', 'change', 'mouseover', 'mouseout', 'mousedown', 'mouseup', 'mousemove',
    'keydown', 'keypress', 'keyup', 'focus', 'blur', 'submit', 'reset',
    'resize', 'scroll', 'select'
];

// Add event listeners for all events
events.forEach(eventType => {
    document.addEventListener(eventType, (event) => {
        sendEventToServer(eventType, event);
    }, true);
});