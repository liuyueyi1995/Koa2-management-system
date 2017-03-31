/**
 * Author: liuyueyi0126@qq.com
 */
$(function (){
  $(document).ready(function(){
    $('.btn-search').click(search); //搜索栏的搜索按钮 触发ajax
    $('body').on('click','.page',function() { //分页按钮 根据搜索框是否有内容，来决定触发AJAX的action值
      $(this).siblings().removeClass('active'); //被点击的按钮变为active
      $(this).addClass('active');
      let page = $(this).attr("page");
      let search_content = $('#searchBox').val();
      let action = 0;
      if (page == 'first') { //获取页码
        fetch_num = 1
      } else if (page == 'last') {
        fetch_num = $(this).attr("page_max")
      } else {
        fetch_num = $(this).attr("page")
      }
      if (search_content) { //判断搜索框内容
        action = 5;
      }
      let content = {
        page: fetch_num,
        search_content: search_content
      }
      $.ajax(
        {
          url:'/log_manage',
          data:{content:content,action:action},
          type:"post",
          success: function(result) {
            let tbody = $('tbody');
            tbody.html("");
            var tableTemplate = Handlebars.compile($("#table-template").html()); //使用handlebars模板完成数据的循环填充和变量插入
            $("tbody").html(tableTemplate(result));
          }
        }
      );
    });
  });
});

function search() {
  let content = $('#searchBox').val();
  console.log(content)
  if (content) {
    $.post('/log_manage',{content:content,action:1},function(result){
      if ($.isEmptyObject(result.logs)) { //如果没有查询到数据则返回提示
        $('#banner-danger span').text("没有匹配的结果!").parent().parent().removeClass('hidden');
      } else { //如果查询到数据则动态生成表格
        $('#banner-search span').text("搜索结果如下：").parent().parent().removeClass('hidden');
        let tbody = $('tbody');
        tbody.html("");
        var tableTemplate = Handlebars.compile($("#table-template").html()); //使用handlebars模板完成数据的循环填充和变量插入
        $("tbody").html(tableTemplate(result));
        let page = $('#pagination');
        page.html("");
        $('<li class="page" page="first"><a>&laquo</a></li>').appendTo(page);
        for (var i = 1;i < result.page_num+1;i++) {
          $('<li class="page" page='+i+'><a>'+i+'</a></li>').appendTo(page);
        }
        $('<li class="page" page="last" page_max='+result.page_num+'><a>&raquo</a></li>').appendTo(page);
      }
    });
  } else {
    $('#banner-danger span').text("请输入搜索条件!").parent().parent().removeClass('hidden');
  }
}
