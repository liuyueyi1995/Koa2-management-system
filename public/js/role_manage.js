$(function (){
  $(document).ready(function(){
    $('.btn-add').click(add); //搜索栏的添加按钮 触发ajax
    $('.btn-delete').click(del); //模态框里的删除按钮 触发ajax
    $('.btn-update').click(update); //模态框里的修改按钮 触发ajax
    $('.btn-search').click(search); //搜索栏的搜索按钮 利用css实现搜索
    $('body').on('click','#btn-confirm',function() { //返回信息模态框的确认按钮，点击之后隐藏模态框
      $('#infoReturn').modal('hide');
    });
    $('#infoReturn').on('hidden.bs.modal', function () { //返回信息模态框隐藏之后，刷新页面
      location.reload();
    });
    $('body').on('click','.btn-upd',function() { //表格里的修改按钮 将该行的信息写入模态框
      let origin_info = $(this).attr("data-result");
      let info_obj = eval('('+origin_info+')'); //字符串转换成json对象
      $('#id_upd').val(info_obj.id);
      $('#user_upd').val(info_obj.user_name);
      $('#site_upd').val(info_obj.site_name);
      $('#study_upd').val(info_obj.study_name);
      $('#type_upd').val(info_obj.type);
      $('#state_upd').val(info_obj.state);
      $('#expiring_date_upd').val(info_obj.expiring_date);
    });
    $('body').on('click','.btn-del',function() { //表格里的删除按钮 将该行对应的id传递给模态框
      $('#del_confirm').html('确认删除 id = ' + $(this).attr("data-id")+' 的角色信息?');
      $('#del_id').html($(this).attr("data-id"));
    });
    $('body').on('click','#btn-ad',function() { //搜索框旁边的添加按钮 将所有已存在的用户信息传递给模态框
      let origin_user = $(this).attr("data-user");
      let user_obj = eval('('+origin_user+')'); //字符串转换成json对象
      let select_user = $('#user');
      select_user.html(""); //先清空下拉选项
      for(var item in user_obj){ //item是下标
        let option = $('<option value='+ user_obj[item].id +'>'+ user_obj[item].name+'('+user_obj[item].email+')'+'</option>');
        option.appendTo(select_user); //添加节点
      }
      let origin_study = $(this).attr("data-study");
      let study_obj = eval('('+origin_study+')'); //字符串转换成json对象
      let select_study = $('#study');
      select_study.html(""); //先清空下拉选项
      for(var item in study_obj){ //item是下标
        let option = $('<option value='+ study_obj[item].id +'>'+ study_obj[item].name+'</option>');
        option.appendTo(select_study); //添加节点
      }
    });
    $('body').on('change','#type',function(){ //级联下拉菜单，当选中的项目改变时，触发ajax修改机构信息
      let type = $(this).val();
      let id = $('#study').val();
      if (type == 'STUDY_ADMIN') {
        $('#site').val('').attr('disabled','true');
      } else {
        $('#site').removeAttr('disabled');
        $.ajax(
          {
            url:'/role_manage',
            data:{content:id,action:7},
            type:"post",
            beforeSend: function() {
              $("#tips").html("<span style='color:blue'>正在处理...</span>");
            },
            success: function(result) {
              if (result) {
                let select_site = $('#site');
                select_site.html(""); //先清空下拉选项
                for(var item in result.sites){ //item是下标
            let option = $('<option value='+ result.sites[item].id +'>'+ result.sites[item].name+'</option>');
            option.appendTo(select_site); //添加节点
                }
              } else {
                $("#tips").html("<span style='color:blue'>出现错误！</span>");
              }
            },
            error: function() {
              alert('请求出错');
            },
            complete: function() {
              $('#tips').hide();
            }
          }
        );
      }
    });
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
          url:'/role_manage',
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

function add() {
  let user = $('#user').val();
  let study = $('#study').val();
  let site = $('#site').val();
  let type = $('#type').val();
  let state = $('#state').val();
  let expiring_date = $('#expiring_date').val();
  if ($.trim(user) == '') {
    $('#warning1').text('用户为必填项！');
    return;
  } else {
    $('#warning1').text('');
  }
  if ($.trim(study) == '') {
    $('#warning2').text('项目名称为必填项！');
    return;
  } else {
    $('#warning2').text('');
  }
  if ($.trim(type) == '') {
    $('#warning4').text('角色类型为必填项！');
    return;
  } else {
    $('#warning4').text('');
  }
  if ($.trim(state) == '') {
    $('#warning5').text('角色状态为必填项！');
    return;
  } else {
    $('#warning5').text('');
    let newRole = {
      "user":user,
      "study":study,
      "type":type,
      "state":state
    };
    if (site) {
      newRole.site = site;
    }
    if (expiring_date) {
      newRole.expiring_date = expiring_date;
    }
    $.ajax(
      {
        url:'/role_manage',
        data:{content:newRole,action:2},
        type:"post",
        beforeSend: function() {
          $("#tips").html("<span style='color:blue'>正在处理...</span>");
        },
        success: function(result) {
          if (result) {
            $('#add').modal('hide');
            $('#infoBody').text(result.ret);
            $('#infoReturn').modal('show');
          } else {
            $("#tips").html("<span style='color:blue'>出现错误！</span>");
          }
        },
        error:function() {
          alert('请求出错');
        },
        complete:function() {
          $('#tips').hide();
        }
      }
    );
  }
}

function del() {
  let id = $(this).parent().prev().html();
  $.ajax(
    {
      url:'/role_manage',
      data:{content:id,action:3},
      type:"post",
      beforeSend: function() {
        $("#tips1").html("<span style='color:blue'>正在处理...</span>");
      },
      success: function(result) {
        if (result) {
          $('#delete').modal('hide');
          $('#infoBody').text(result.ret);
          $('#infoReturn').modal('show');
        } else {
          $("#tips1").html("<span style='color:blue'>出现错误！</span>");
        }
      },
      error: function() {
        alert('请求出错');
      },
      complete: function() {
        $('#tips1').hide();
      }
    }
  );
}

function search() {
  let content = $.trim($('#searchBox').val());
  if (content) {
    $.post('/role_manage',{content:content,action:1},function(result){
      if ($.isEmptyObject(result.roles)) { //如果没有查询到数据则返回提示
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

function update() {
  let id = $('#id_upd').val();
  let state = $('#state_upd').val();
  let expiring_date = $('#expiring_date_upd').val();
  let newRole = {
    "id":id,
    "state":state
  };
  if (expiring_date) {
    newRole.expiring_date = expiring_date;
  }
  $.ajax(
    {
      url:'/role_manage',
      data:{content:newRole,action:4},
      type:"post",
      beforeSend: function() {
        $("#tips").html("<span style='color:blue'>正在处理...</span>");
      },
      success: function(result) {
        if (result) {
          $('#update').modal('hide');
          $('#infoBody').text(result.ret);
          $('#infoReturn').modal('show');
        } else {
          $("#tips").html("<span style='color:blue'>出现错误！</span>");
        }
      },
      error:function() {
        alert('请求出错');
      },
      complete:function() {
        $('#tips').hide();
      }
    }
  );
}

