$(function() {
	$('[data-toggle="tooltip"]').tooltip();
});

$('tr').bind('mouseover', function() {
	onHover($(this)[0]);

	$('tr').bind('mouseout', function() {
		offHover($(this)[0]);
	});
});

// Row is active (mouse is hovering or checkbox is ticked)
function onHover(item, parent) {
	if (parent) {
		item.parentElement.classList.remove('hide');
		if (item.getAttribute('data-option') == '1') return;
		item.parentElement.parentElement.parentElement.style.background = '#edebe9';
	} else {
		if (item.childNodes[1].childNodes[1].childNodes[1].getAttribute('data-option') == '1') return;
		item.style.background = '#edebe9';
	}
}

// Row is no longer active (mouse has stopped hovering or checkbox is not ticked)
function offHover(item, parent) {
	if (parent) {
		item.parentElement.classList.add('hide');
		if (item.getAttribute('data-option') == '1') return;
		item.parentElement.parentElement.parentElement.style.background = 'white';
	} else {
		if (item.childNodes[1].childNodes[1].childNodes[1].getAttribute('data-option') == '1') return;
		item.style.background = 'white';
	}
}

function updateAll() {
	if (!document.getElementById('All').checked) {
		const checkboxes = document.querySelectorAll('input[type=checkbox]');
		checkboxes.forEach((checkbox) => {
			if (checkbox.id == 'All' || !checkbox.checked) return;
			updateValue(checkbox.id);
		});
		document.getElementById('All').setAttribute('data-option', '0');
		offHover(document.getElementById('All'), true);
	} else {
		const checkboxes = document.querySelectorAll('input[type=checkbox]');
		checkboxes.forEach((checkbox) => {
			if (checkbox.id == 'All' || checkbox.checked) return;
			updateValue(checkbox.id);
		});
		document.getElementById('All').setAttribute('data-option', '1');
		onHover(document.getElementById('All'), true);
	}
}

function updateValue(id, ignore) {
	if (document.getElementById(id).checked) {
		document.getElementById(id).setAttribute('data-option', '0');
		offHover(document.getElementById(id), true);
		if (document.getElementById('All').checked && !ignore) updateValue('All', true);
	} else {
		onHover(document.getElementById(id), true);
		document.getElementById(id).setAttribute('data-option', '1');
	}
	document.getElementById(id).checked = !document.getElementById(id).checked;
}

$(document).ready(function($) {
	$('.clickable-row').click(function() {
		window.location = $(this).data('href');
	});

	// Custom context menu
	oncontextmenu = (e) => {
		if (e.target.parentElement != null && e.target.parentElement.childNodes[3]?.className == 'text-truncate') {
			const file = e.target.parentElement.childNodes[3].outerText;
			console.log(file);
			e.preventDefault();
			const menu = document.createElement('div');
			menu.id = 'ctxmenu';
			menu.style = `top:${e.pageY}px;left:${e.pageX}px`;
			menu.onmouseleave = () => ctxmenu.outerHTML = '';
			menu.innerHTML = `<ul class="list-group list-group-flush">
        <li class="list-group-item border-0"><a href="/">Share</a></li>
        <li class="list-group-item border-0"><a href="/">Copy link</a></li>
      </ul>
        <hr class="mt-2 mb-3"/>
      <ul class="list-group list-group-flush">
        <li class="list-group-item border-0"><a href="/">Download</a></li>
        <li class="list-group-item border-0"><a href="/">Delete</a></li>
        <li class="list-group-item border-0"><a href="/">Move to</a></li>
        <li class="list-group-item border-0"><a href="/">Copy to</a></li>
        <li class="list-group-item border-0"><a href="/">Rename</a></li>
      </ul>
      <form action="/files/delete" method="post" ref='uploadForm' id='uploadForm'>
        <input type="hidden" value="<%= path %>${file}" name="path">
        <button type="submit" class="btn" id="imagefile">${file}</button>
      </form>`;
			document.body.appendChild(menu);
		}
	};
});

// Sorts table
const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;
const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
	v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
)(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

// Activate everytime table header is clicked
document.querySelectorAll('th')
	.forEach(th => {
		if (th.className == 'text-truncate') return;
		return th.addEventListener('click', (() => {
			const table = th.closest('table');
			const element = document.getElementById(th.id);
			if (!element) return;
			element.innerHTML = element.id + ((!this.asc) ? ' <i class="fas fa-sort-up"></i>' : ' <i class="fas fa-sort-down"></i>');
			Array.from(table.childNodes[3].querySelectorAll('tr:nth-child(n+1)'))
				.sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
				.forEach(tr => table.childNodes[3].appendChild(tr));
		}));
	});
