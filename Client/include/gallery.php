<link href="assets/css/gallery.css" rel="stylesheet">
<div class="row center">
    <div style="margin-bottom:10px; text-align:center;">
        <input id="skinUrlInput" class="form-control" placeholder="Paste skin URL (https://...)" style="display:inline-block; width:70%; margin-right:6px;" />
        <button class="btn btn-primary" onclick="(function(){var v=document.getElementById('skinUrlInput').value.trim(); if(!v) return; document.getElementById('nick').value='{' + v + '} '; $('#inPageModal').modal('hide');})();">Use URL</button>
    </div>
    <ul>
        <?php
            # Skin directory relative to include/gallery.php (this file)
            $skindir = "../skins/";

            # Skin directory relative to index.html
            $skindirhtml = "./skins/";

            $images = scandir($skindir);

            foreach($images as $curimg) {
                if (strtolower(pathinfo($curimg, PATHINFO_EXTENSION)) == "png") {
        <li class="skin" onclick="$('#skin').val($(this).find('.title').text()); $('#skin').trigger('input'); $('#inPageModal').modal('hide');">
        <li class="skin" onclick="$('#nick').val('{' + $(this).find('.title').text() + '} ');" data-dismiss="modal">
            <div class="circular" style='background-image: url("./<?php echo $skindirhtml.$curimg ?>")'></div>
            <h4 class="title"><?php echo pathinfo($curimg, PATHINFO_FILENAME); ?></h4>
        </li>
        <?php
                }
            }
        ?>
    </ul>
        <input id="skinUrlInput" class="form-control" placeholder="Paste skin URL (https://...)" style="display:inline-block; width:70%; margin-right:6px;" />
        <button class="btn btn-primary" onclick="(function(){var v=document.getElementById('skinUrlInput').value.trim(); if(!v) return; if(document.getElementById('skin')) { document.getElementById('skin').value = v; $('#skin').trigger('input'); } $('#inPageModal').modal('hide');})();">Use URL</button>
