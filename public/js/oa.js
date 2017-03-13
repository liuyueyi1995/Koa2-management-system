/**
Author: liuyueyi0126@qq.com
*/
$(function (){
	$('.btn-danger').bind('click',function(event) {
		var del=false;
		del=confirm("确定要删除吗？");
		if (del) {
			//发送请求
			/*
			$.get("?t=" + t, { id: id}, function (ret) {
            fillItems(ret);
			*/
		}
	});
	
	$('.nav-pills>li').click(function() {
		$(this).siblings().removeClass("active");
		$(this).addClass("active");
	});
});
function fillItems(items) {
    $("#lstBody").html(items);
    rowHighlight();
}
function rowHighlight() {
    $("#lstBody tr").mouseover(function () {
        $(this).addClass("over");
    }).mouseout(function () {
        $(this).removeClass("over");
    });
}