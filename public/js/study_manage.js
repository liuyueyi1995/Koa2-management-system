$(function (){
  $(document).ready(function(){
    $('.btn-add').click(add); //模态框里的添加按钮 触发ajax
    $('.btn-delete').click(del); //模态框里的删除按钮 触发ajax
    $('.btn-search').click(search); //搜索栏的搜索按钮 触发ajax
    $('.btn-update').click(update); //模态框里的修改按钮 触发ajax
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
      $('#uid_upd').val(info_obj.uid);
      $('#name_upd').val(info_obj.name);
      $('#state_upd').val(info_obj.state);
      $('#contract_number_upd').val(info_obj.contract_number)
      $('#type_upd').val(info_obj.type)
      $('#due_date_upd').val(info_obj.due_date)
      $('#need_audit_upd').val(info_obj.need_audit)
    });
    $('body').on('click','.btn-del',function() { //表格里的删除按钮 将该行对应的id传递给模态框
      $('#del_confirm').html('确认删除 id = ' + $(this).attr("data-id")+' 的项目?');
      $('#del_id').html($(this).attr("data-id"));
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
          url:'/study_manage',
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
  let uid = $('#uid').val();
  let name = $('#name').val();
  let state = $('#state').val();
  let contract_number = $('#contract_number').val();
  let type = $('#type').val();
  let due_date = $('#due_date').val();
  let need_audit = $('input[name="need_audit"]:checked').val();
  if ($.trim(uid) == '') {
    $('#warning1').text('项目uid为必填项！');
    return;
  } else {
    $('#warning1').text('');
  }
  if ($.trim(name) == '') {
    $('#warning2').text('项目名称为必填项！');
    return;
  } else {
    $('#warning2').text('');
  }
  if ($.trim(state) == '') {
    $('#warning3').text('项目状态为必填项！');
    return;
  } else {
    $('#warning3').text('');
  }
  if ($.trim(contract_number) == '') {
    $('#warning4').text('病例数为必填项！');
    return;
  } else if (!(/^[0-9]+$/.test($.trim(contract_number)))) {
    $('#warning4').text('病例数只能为数字！');
    return;
  } else {
    $('#warning4').text('');
  }
  if ($.trim(type) == '') {
    $('#warning5').text('项目类型为必填项！');
    return;
  } else {
    $('#warning5').text('');
  }
  if ($.trim(due_date) == '') {
    $('#warning6').text('截止日期为必填项！')
  } else {
    $('#warning6').text('');
    let newStudy = {
      "uid":uid,
      "name":name,
      "state":state,
      "contract_number":contract_number,
      "type":type,
      "due_date":due_date,
      "need_audit":need_audit
    };
    $.ajax(
      {
        url:'/study_manage',
        data:{content:newStudy,action:2},
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
    return false;
  }
}

function del() {
  let id = $(this).parent().prev().html();
  $.ajax(
    {
      url:'/study_manage',
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
      error:function() {
        alert('请求出错');
      },
      complete:function() {
        $('#tips1').hide();
      }
    }
  );
}

function search() {
  let content = $('#searchBox').val();
  if (content) {
    $.post('/study_manage',{content:content,action:1},function(result){
      if ($.isEmptyObject(result.studies)) { //如果没有查询到数据则返回提示
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
  let uid = $('#uid_upd').val();
  let name = $('#name_upd').val();
  let state = $('#state_upd').val();
  let contract_number = $('#contract_number_upd').val();
  let type = $('#type_upd').val();
  let due_date = $('#due_date_upd').val();
  let need_audit = $('input[name="need_audit_upd"]:checked').val();
  if ($.trim(uid) == '') {
    $('#warning8').text('项目uid为必填项！');
    return;
  } else {
    $('#warning8').text('');
  }
  if ($.trim(name) == '') {
    $('#warning9').text('项目名称为必填项！');
    return;
  } else {
    $('#warning9').text('');
  }
  if ($.trim(state) == '') {
    $('#warning10').text('项目状态为必填项！');
    return;
  } else {
    $('#warning10').text('');
  }
  if ($.trim(contract_number) == '') {
    $('#warning11').text('病例数为必填项！');
    return;
  } else if (!(/[0-9]/.test($.trim(contract_number)))) {
    $('#warning11').text('病例数只能为数字！');
    return;
  } else {
    $('#warning11').text('');
  }
  if ($.trim(type) == '') {
    $('#warning12').text('项目类型为必填项！');
    return;
  } else {
    $('#warning12').text('');
  }
  if ($.trim(due_date) == '') {
    $('#warning13').text('截止日期为必填项！')
  } else {
    $('#warning13').text('');
    let newStudy = {
      "id":id,
      "uid":uid,
      "name":name,
      "state":state,
      "contract_number":contract_number,
      "type":type,
      "due_date":due_date,
      "need_audit":need_audit
    };
    $.ajax(
      {
        url:'/study_manage',
        data:{content:newStudy,action:4},
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
    return false;
  }
}


