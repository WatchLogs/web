<header id="toolbar">
	<div id="user-name"><?= $user['name'] ?></div>
	<div id="editor-buttons">
		<button id="editor-undo" class="disabled" title="отменить"><span class="fa fa-undo"></span></button>
		<button id="editor-redo" class="disabled" title="повторить"><span class="fa fa-repeat"></span></button>
		<button id="editor-save" class="disabled" title="сохранить"><span class="fa fa-save"></span></button>
		<button id="editor-copy" class="disabled" title="копировать"><span class="fa fa-copy"></span></button>
		<button id="editor-cut" class="disabled" title="вырезать"><span class="fa fa-cut"></span></button>
		<button id="editor-paste" title="вставить"><span class="fa fa-paste"></span></button>
		<input id="editor-search-input" type="text" placeholder="поиск...">
		<button id="editor-search" title="поиск"><span class="fa fa-search"></span></button>
		<button id="editor-settings" title="настройки"><span class="fa fa-cogs"></span></button>
	</div>
	<a id="logout" href="?logout" title="выход"><span class="fa fa-sign-out"></span></a>
</header>

<div class="content">
	<aside id="tree" class="loading" tabindex="0">
		<div id="tree-navbar">
			<button id="tree-up" title="level up"><span class="fa fa-level-up"></span></button>
			<input id="tree-root" type="text">
		</div>
		<ul id="tree-list"></ul>
		<div id="tree-toolbar">
			<div id="tree-butons">
				<button class="tree-add-folder disabled" title="создать папку"><span class="fa fa-folder-o"></span></button>
				<button class="tree-add-file disabled" title="создать файл"><span class="fa fa-file-o"></span></button>
				<button class="tree-rename disabled" title="переименовать"><span class="fa fa-i-cursor"></span></button>
				<button class="tree-download disabled" title="скачать"><span class="fa fa-download"></span></button>
				<input id="upload-file" type="file" multiple="true">
				<button class="tree-upload disabled" title="загрузить"><span class="fa fa-upload"></span></button>
				<button class="tree-delete disabled" title="удалить"><span class="fa fa-remove"></span></button>
			</div>
		</div>
		<div id="tree-busy"></div>
		<div class="splitter splitter-vertical" tabindex="0"></div>
	</aside>
	<div id="viewport">
		<div>
			<ul id="tabs"></ul>
			<div id="panels"></div>
			<div id="status">
				<div id="file-name"></div>
				<div id="cursor-pos"></div>
				<div id="file-size"></div>
			</div>
		</div>
	</div>
	<div id="tree-menu" tabindex="0">
		<ul>
			<li class="tree-open disabled"><span class="fa fa-mail-forward"></span><b>open</b></li>
			<li class="tree-add-folder disabled"><span class="fa fa-folder-o"></span>create folder</li>
			<li class="tree-add-file disabled"><span class="fa fa-file-o"></span>create file</li>
			<li class="separator disabled"></li>
			<li class="tree-rename disabled"><span class="fa fa-i-cursor"></span>rename</li>
			<li class="tree-download disabled"><span class="fa fa-download"></span>download</li>
			<li class="tree-upload disabled"><span class="fa fa-upload"></span>upload</li>
			<li class="tree-delete disabled"><span class="fa fa-remove"></span>delete</li>
		</ul>
	</div>
</div>

<script type="text/javascript" src="assets/ace/src-noconflict/ace.js"></script>
<script type="text/javascript" src="assets/ace/src-noconflict/ext-settings_menu.js"></script>
<script type="text/javascript" src="assets/js/web-mutator.js"></script>
<script type="text/javascript">
	webmutator.init().treeLoad('./');
</script>
