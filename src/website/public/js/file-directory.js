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

// Copy the URL
function copyURL(str) {
	navigator.clipboard.writeText(str);
	window.location = '/files?success=URL has been copied.';
}

// Allow the file to be shared with other people
async function shareFile(file) {
	$.ajax({
		url: '/files/share',
		type: 'POST',
		data: JSON.stringify({ 'path': file }),
		dataType: 'json',
		contentType: 'application/json',
		complete: function(data) {
			const resp = JSON.parse(data.responseText);
			const URL = window.location.pathname.slice(7)[1] ? window.location.pathname.slice(7) : '';
			$('#shareURLInput').attr('value', `${window.origin}/share/${document.getElementById('user_id').innerHTML}/${resp.success.id}`);
			$('#shareURLBTN').attr('onclick', `copyURL('${window.origin}/share/${document.getElementById('user_id').innerHTML}/${resp.success.id}')`);
			$('#shareModel').modal('show');
		},
	});
}

// download folder (turns folders to .zip)
function downloadFolder(folder, name) {
	console.log(`name: ${name}`);
	$.ajax({
		url: '/files/download',
		type: 'POST',
		data: JSON.stringify({ 'path': folder }),
		dataType: 'json',
		contentType: 'application/json',
		complete: function(data) {
			console.log(data);
			console.log(data.responseJSON.data);
			const link = document.createElement('a');
			link.href = `data:application/zip;base64,${data.responseJSON.data}`;
			link.download = `${name}.zip`;
			console.log(link);
			document.body.appendChild(link);
			link.click();
		},
	});
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

	return {
		x: posx,
		y: posy,
	};
}
$(document).ready(function($) {
	$('.upload-input').on('change', function() {
		const files = $(this)[0].files;
		console.log('h');
		console.log(files);
		if (files.length > 0) {
			// create a FormData object which will be sent as the data payload in the
			const formData = new FormData();

			// loop through all the selected files and add them to the formData object
			for (const file of files) {
				// add the files to formData object for the data payload
				const name = file.webkitRelativePath.length >= 1 ? file.webkitRelativePath : file.name;
				formData.append('uploads[]', file, name);
			}

			// Send data
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
					console.log('boo');
					// create an XMLHttpRequest
					const xhr = new XMLHttpRequest();
					// listen to the 'progress' event
					console.log(xhr);
					xhr.upload.addEventListener('progress', function(evt) {
						if (evt.lengthComputable) {
							// calculate the percentage of upload completed
							let percentComplete = evt.loaded / evt.total;
							percentComplete = parseInt(percentComplete * 100);
							console.log(percentComplete);
							// update the Bootstrap progress bar with the new percentage
							$('.upload').text(percentComplete + '%');
							$('.upload').width(percentComplete + '%');
							// once the upload reaches 100%, set the progress bar text to done
							if (percentComplete === 100) {
								$('.upload').html('Done');
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
			document.getElementById('ctxmenu')?.remove();
			// Check to see if any checkboxes were selected
			const table = $('table tr');
			const checkedItems = table.filter(th => table[th].childNodes[1].childNodes[1].childNodes[1].checked);
			// Create context menu
			const menu = document.createElement('div');
			const user = document.getElementById('user_id').innerHTML;
			menu.id = 'ctxmenu';
			menu.onmouseleave = () => menu.outerHTML = '';
			e.preventDefault();
			if (checkedItems.length >= 1) {
				menu.innerHTML = `
				<a class="btn btn-ctx-menu" href="${window.origin}/user-content/${user}/${window.location.pathname.slice(7)}/" download>Download ${checkedItems.length} item</a>
				<form action="/files/delete" method="post" ref='uploadForm' id='uploadForm'>
					<input class="btn btn-ctx-menu" type="hidden" value="/${window.location.pathname.slice(7)}/" name="path">
					<button class="btn btn-ctx-menu" type="submit" id="imagefile">Delete ${checkedItems.length} items</button>
				</form>
				<a class="btn btn-ctx-menu" href="/">Move to</a>
				<a class="btn btn-ctx-menu" href="/">Copy to</a>`;
			} else {
				const URL = window.location.pathname.slice(7)[1] ? window.location.pathname.slice(7) : '';
				const file = e.target.parentElement.childNodes[5].outerText;
				menu.innerHTML = `
				<button class="btn btn-ctx-menu" onClick="shareFile(\`/${window.location.pathname.slice(7)}/${file.toString()}\`)"><i class="fas fa-share-alt"></i> Share</button>
				<button class="btn btn-ctx-menu" data-toggle="modal" data-target="#copyURLModel"><i class="fas fa-copy"></i> Copy link</button>
				${!e.target.parentElement.childNodes[7].outerText.includes('files') ?
		`<a class="btn btn-ctx-menu" href="${window.origin}/user-content/${user}/${URL}${file.toString()}" download><i class="fas fa-download"></i> Download</a>`
		: `<button class="btn btn-ctx-menu" onClick="downloadFolder(\`${URL}${file.toString()}\`, \`${file.toString()}\`)"><i class="fas fa-download"></i> Download</button>`}
				<button type="button" class="btn btn-ctx-menu" data-toggle="modal" data-target="#deleteModel">
			  	<i class="fas fa-trash"></i> Delete
				</button>
				<button class="btn btn-ctx-menu" data-toggle="modal" data-target="#changeModel"><i class="fas fa-copy"></i> Move / Copy to</button>
				<button class="btn btn-ctx-menu" type="button" data-toggle="modal" data-target="#renameModel"><i class="fas fa-file-signature"></i> Rename</button>
				<button class="btn btn-ctx-menu"><i class="fas fa-ellipsis-v"></i> Details</button>`;

				// Show rename file/folder pop-up message
				$('#renameModel').on('show.bs.modal', function() {
					$(this).find('.modal-title').html(`Rename: ${file.toString()}`);
					$(this).find('#renameInput').attr('value', file.toString().split('.')[0]);
					if (!e.target.parentElement.childNodes[7].outerText.includes('files')) {
						$(this).find('#renameSuffix').css('display', 'block');
						$(this).find('#renameSuffix').html(`.${file.toString().split('.')[1]}`);
					} else {
						$(this).find('#renameSuffix').css('display', 'none');
					}
					$(this).find('#oldName').attr('value', file.toString());
					$(this).find('#folder').attr('value', `${window.location.pathname.slice(7) ?? '/'}`);
				});

				// Show copy URL pop-up message
				$('#copyURLModel').on('show.bs.modal', function() {
					const URL = window.location.pathname.slice(7)[1] ? window.location.pathname.slice(7) : '';
					$('#copyURLInput').attr('value', `${window.origin}/files/${URL}${file.toString()}`);
					$('#copyURLBTN').attr('onclick', `copyURL(\`${window.origin}/files/${URL}${file.toString()}\`)`);
				});

				// Show Copy / Move pop-up message
				$('#changeModel').on('show.bs.modal', function() {
					// Reset folder list
					const node = document.getElementById('folderList');
					node.innerHTML = '';

					$(this).find('.modal-title').html(`Move or Copy "${file.toString()}"`);
					const folders = table.filter(row => table[row].childNodes[7].outerText.includes('files')).map(item => {
						const fragment = document.createRange().createContextualFragment(`
						<input type="radio" id="chng_${table[item + 1].childNodes[5].outerText}" name="${table[item + 1].childNodes[5].outerText}" value="${table[item + 1].childNodes[5].outerText}">
  					<label for="chng_${table[item + 1].childNodes[5].outerText}">${table[item + 1].childNodes[5].outerText}</label>
						`);
						document.getElementById('folderList').appendChild(fragment);
					});
					console.log(folders);
				});

				// Delete modal confirmation pop-up
				$('#deleteModel').on('show.bs.modal', function() {
					$(this).find('#deleteInput').attr('value', `/${window.location.pathname.slice(7)}/${file.toString()}`);
					$(this).find('#DeleteTitle').html(`Delete ${file.toString()}?`);
				});
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
