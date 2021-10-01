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
function copyURL(str) {
	navigator.clipboard.writeText(str);
}

function getPosition(e) {
	let posx = 0;
	let posy = 0;

	if (!e) e = window.event;

	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}

	return { x: posx, y: posy };
}
$(document).ready(function($) {
	$('#upload-input').on('change', function() {
		const files = $(this).get(0).files;
		if (files.length > 0) {
			// create a FormData object which will be sent as the data payload in the
			// AJAX request
			const formData = new FormData();
			// loop through all the selected files and add them to the formData object
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				// add the files to formData object for the data payload
				formData.append('uploads[]', file, file.name);
			}
			$.ajax({
				url: '/files/upload',
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				success: function(data) {
					console.log('upload successful!\n' + data);
				},
				xhr: function() {
					// create an XMLHttpRequest
					const xhr = new XMLHttpRequest();
					// listen to the 'progress' event
					xhr.upload.addEventListener('progress', function(evt) {
						if (evt.lengthComputable) {
							// calculate the percentage of upload completed
							let percentComplete = evt.loaded / evt.total;
							percentComplete = parseInt(percentComplete * 100);
							// update the Bootstrap progress bar with the new percentage
							$('.progress-bar').text(percentComplete + '%');
							$('.progress-bar').width(percentComplete + '%');
							// once the upload reaches 100%, set the progress bar text to done
							if (percentComplete === 100) {
								$('.progress-bar').html('Done');
								window.location = '/files';
							}
						}
					}, false);
					return xhr;
				},
			});
		}
	});
	$('#upload-input-2').on('change', function() {
		const files = $(this).get(0).files;
		if (files.length > 0) {
			// create a FormData object which will be sent as the data payload in the
			// AJAX request
			const formData = new FormData();
			// loop through all the selected files and add them to the formData object
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				// add the files to formData object for the data payload
				formData.append('uploads[]', file, file.webkitRelativePath || file.name);
			}

			$.ajax({
				url: '/files/upload',
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				success: function(data) {
					console.log('upload successful!\n' + data);
				},
				xhr: function() {
					// create an XMLHttpRequest
					const xhr = new XMLHttpRequest();
					// listen to the 'progress' event
					xhr.upload.addEventListener('progress', function(evt) {
						if (evt.lengthComputable) {
							// calculate the percentage of upload completed
							let percentComplete = evt.loaded / evt.total;
							percentComplete = parseInt(percentComplete * 100);
							// update the Bootstrap progress bar with the new percentage
							$('.progress-bar').text(percentComplete + '%');
							$('.progress-bar').width(percentComplete + '%');
							// once the upload reaches 100%, set the progress bar text to done
							if (percentComplete === 100) {
								$('.progress-bar').html('Done');
								window.location = '/files';
							}
						}
					}, false);
					return xhr;
				},
			});
		}
	});

	// Custom context menu
	oncontextmenu = (e) => {
		if (e.target.parentElement != null && e.target.parentElement.childNodes[5]?.className == 'text-truncate') {
			// Check to see if any checkboxes were selected
			const table = $('table tr');
			const checkedItems = table.filter(th => table[th].childNodes[1].childNodes[1].childNodes[1].checked);
			// Create context menu
			const menu = document.createElement('div');
			const user = document.getElementById('user_id').innerHTML;
			console.log(window.location.pathname.slice(7));
			menu.id = 'ctxmenu';
			menu.onmouseleave = () => ctxmenu.outerHTML = '';
			e.preventDefault();
			if (checkedItems.length >= 1) {
				menu.innerHTML = `
				<p><a href="${window.origin}/user-content/${user}/${window.location.pathname.slice(7)}/" download>Download ${checkedItems.length} item</a></p>
				<form action="/files/delete" method="post" ref='uploadForm' id='uploadForm'>
					<input type="hidden" value="/${window.location.pathname.slice(7)}/" name="path">
					<p><button type="submit" id="imagefile" href="#">Delete ${checkedItems.length} items</button></p>
				</form>
				<p><a href="/">Move to</a></p>
				<p><a href="/">Copy to</a></p>`;
			} else {
				const file = e.target.parentElement.childNodes[5].outerText;
				menu.innerHTML = `<form action="/files/share" method="post" ref='uploadForm' id='uploadForm'>
					<input type="hidden" value="/${window.location.pathname.slice(7)}/${file.toString()}" name="path">
					<p><button type="submit" id="imagefile" href="#">Share</button></p>
				</form>
				<p><a onClick="copyURL(\`${window.origin}/user-content/${user}/${window.location.pathname.slice(7)}/${file.toString()}\`)">Copy link</a></p>
				<hr class="mt-2 mb-3"/>
				<p><a href="${window.origin}/user-content/${user}/${window.location.pathname.slice(7)}/${file.toString()}" download>Download</a></p>
				<form action="/files/delete" method="post" ref='uploadForm' id='uploadForm'>
					<input type="hidden" value="/${window.location.pathname.slice(7)}/${file.toString()}" name="path">
					<p><button type="submit" id="imagefile" href="#">Delete</button></p>
				</form>
				<p><a href="/">Move to</a></p>
				<p><a href="/">Copy to</a></p>
				<p><a href="/">Rename</a></p>
				<p><a href="/">Details</a></p>`;
			}
			document.body.appendChild(menu);
			// Calculate where it will show on the screen
			const clickCoords = getPosition(e),
				clickCoordsX = clickCoords.x,
				clickCoordsY = clickCoords.y,
				menuWidth = menu.offsetWidth + 4,
				menuHeight = menu.offsetHeight + 4,
				windowWidth = window.innerWidth,
				windowHeight = window.innerHeight;
			// Calculate X value
			if ((windowWidth - clickCoordsX) < menuWidth) {
				menu.style.left = windowWidth - menuWidth + 'px';
			} else {
				menu.style.left = clickCoordsX + 'px';
			}
			// Calculate Y value
			if ((windowHeight - clickCoordsY) < menuHeight) {
				menu.style.top = windowHeight - menuHeight + 'px';
			} else {
				menu.style.top = clickCoordsY + 'px';
			}
		}
	};
});

// Sorts table
const getCellValue = (tr, idx) => tr.children[idx].dataset.truevalue || tr.children[idx].innerText || tr.children[idx].textContent;

const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
	v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
)(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

// Activate everytime table header is clicked
document.querySelectorAll('th')
	.forEach(th => {
		if (th.className == 'text-truncate' || th.id == 'Type') return;
		return th.addEventListener('click', (() => {
			const table = th.closest('table');
			const element = document.getElementById(th.id);
			// update all the other headers to back to default
			const thtags = new Array(...document.querySelectorAll('th')).filter(item => item.className !== 'text-truncate');
			let headers = [thtags[2], thtags[3], thtags[4]];
			headers = headers.filter(item => item.id != element.id);
			headers.forEach(head => head.innerHTML = head.id + ' <i class="bi bi-arrow-down-up"></i>');
			// update clicked item
			element.innerHTML = element.id + ((!this.asc) ? ' <i class="bi bi-arrow-up"></i>' : ' <i class="bi bi-arrow-down"></i>');
			Array.from(table.childNodes[3].querySelectorAll('tr:nth-child(n+1)'))
				.sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
				.forEach(tr => table.childNodes[3].appendChild(tr));
		}));
	});
