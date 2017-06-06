
var userlist;
var socket;

$(document).ready(function () {



    $("#txtmsg").on('keydown', function (e) {
        if ($("#txtmsg:focus") && (e.keyCode == 13)) {
            SendMessage();
        }
    });


    $('#btnsignout').click(function () {
        socket.close();
        ResetForm();
    });

    $('#btn').click(function () {

        socket.emit('chatmessage', $('#m').val());
        $('#m').val('');
        return false;

    });


    $('#btnlogin').click(function () {

        if ($('#txtuserid').val().trim() == '') {
            alert('userid cannot be blank');
            $('#txtuserid').focus();
            return;
        }
        if ($('#txtpassword').val().trim() == '') {
            alert('password cannot be blank');
            $('#txtpassword').focus();
            return;
        }

        SocketCallingMethods('chatlogin');

    });

    $('#btnregister').click(function () {

        if ($('#txtuserid').val().trim() == '') {
            alert('userid cannot be blank');
            $('#txtuserid').focus();
            return;
        }
        if ($('#txtpassword').val().trim() == '') {
            alert('password cannot be blank');
            $('#txtpassword').focus();
            return;
        }
        if ($('#txtusername').val().trim() == '') {
            alert('user name cannot be blank');
            $('#txtusername').focus();
            return;
        }

        SocketCallingMethods('userregistration');

    });


    $('#clickbtn').click(function () {
        jQuery.each(userlist, function (i, val) {
            alert(val.clientid + '     ' + val.userid);

        });
    });

    $('#btnsend').click(function () {
        SendMessage();

    });

    function SendMessage() {
        var fromuserid = $('#hdnuid').val().trim();
        var touserid = $('#spanchatwithpersn').html().trim();
        var msg = $("#txtmsg").val().trim();

        if (fromuserid == '') {
            alert('please login for messaging..');
            return;
        }
        if (touserid == '') {
            alert('please select user for messaging..');
            return;
        }
        if (msg == '') {
            alert('please write some message..');
            $("#txtmsg").focus();
            return;
        }




        socket.emit('chatmessage', fromuserid, touserid, msg);

        var hdr = '<b>Me says ' + touserid + ':</b>';
        $('#dvchatmsg').append("<div class='chatesinglelmt'> <div>" + hdr + "</div> <div>" + msg + "</div> </div>");
        $("#txtmsg").val('');

    }



    SocketCallingMethods = function SocketCallingMethods(callfrom) {

        //Create new instance of socket connection
        socket = io();

        if (callfrom == 'userregistration') {

            //Send Login Request
            socket.emit('newuserregistration', $('#txtuserid').val(), $('#txtpassword').val(), $('#txtusername').val());
            socket.on('newuserregistrationresponse', function (resp) {
                if (resp == 'duplicate') {
                    alert('This userid already exist..Please choose another one..');
                }
                else if (resp == 'success') {
                    $('#txtuserid').val('');
                    $('#txtpassword').val('');
                    $('#txtusername').val('');

                    alert('New user registration completed successfully.');
                }

            });
            return;
        }

        userlist = [];
        g_useridentid = -1;

        //Chat Page
        //Send Login Request
        socket.emit('loginrequest', $('#txtuserid').val(), $('#txtpassword').val());

        //initializing different socket response listening method

        socket.on('chatdeliveryunavailable', function (userid) {
            var msg = userid + " is currently unavailable to receive message";
            $('#dvchatmsg').append("<div class='chatesingleunavailable'><div>" + msg + "</div> </div>")
        }); //END OF chatdeliveryunavailable

        socket.on('chatmessage', function (userid, msg) {

            var hdr = '<b>' + userid + ' says :</b>';
            $('#dvchatmsg').append("<div class='chatesinglelmt'> <div>" + hdr + "</div> <div>" + msg + "</div> </div>")
        }); //END OF chatmessage

        socket.on('loginresponse', function (data) {
            if (data == 'unknownuser') {
                alert('Invalid user name or password..');
            }
            else if (data == 'preloggedin') {
                alert('user already logged in.. please try again later..');
            }
            else if (data == 'loginsuccess') {
                $('#dvusermaster').hide();
                $('#dvchatmaster').show();
                $('#hdnuid').val($('#txtuserid').val().trim());
                $('#hdnpass').val($('#txtpassword').val().trim());
                $('#divwelcome').html('Welcome : ' + $('#hdnuid').val().trim());
            }
        }); //END OF loginresponse


        socket.on('loggedinuserlist', function (data) {

            //Validate that user is loggedin
            if ($('#hdnuid').val() == '') {
                return; //Means user is not logged in yet
            }

            //Loop throgh online user list
            for (var i in data) {
                var _userid = data[i].userid;
                if (_userid != $('#hdnuid').val()) {

                    var objuser = getUserByUserId(_userid);
                    if (objuser == null) {
                        //objuser is null, that means new user

                        g_useridentid = g_useridentid + 1;

                        userlist.push({
                            userid: _userid,
                            identid: g_useridentid
                        });
                        $('#contact-list').append("<li class='left clearfix' id='clnt" + g_useridentid + "'><a onclick='contactclick(this)' id='Aclnt-" + g_useridentid + "' href='#' style='color: #000;'><img src='img/online.png'/>&nbsp;" + _userid + "</a></li> ");

                    }
                    else {
                        //That means existing user, need to activate that user only
                        var identid = objuser.identid;
                        var userid = objuser.userid;
                        document.getElementById('clnt' + identid).innerHTML = "<a onclick='contactclick(this)' id='Aclnt-" + identid + "' href='#' style='color: #000;'><img src='img/online.png'/>&nbsp;" + userid + "</a>";

                    }


                }

            }

        }); //END OF loggedinuserlist


        socket.on('loggedoffuser', function (userid) {

            try {
                //Take out of list to user 
                var _idx = -1;
                var _iloop = 0;
                var _userid = '';
                var _identid = -1;

                jQuery.each(userlist, function (_iloop, val) {
                    if (val.userid == userid) // delete index
                    {
                        _idx = _iloop;
                        _userid = val.userid;
                        _identid = val.identid;
                    }
                });

                if (_idx != -1) {

                    //delete userlist[_idx];
                    document.getElementById('clnt' + _identid).innerHTML = "<span style='color: #abb2b9'><img src='img/offline.png'/>&nbsp;" + _userid + "</span>";
                }

            }
            catch (err) {
                alert(err.message);
            }


        }); //END OF loggedoffuser


    } //end of SocketCallingMethods()



});                               //end of $(document).ready function


function ResetForm() {
    userlist = null;
    socket = null;
    $('#dvusermaster').show();
    $('#dvchatmaster').hide();
    $('#txtuserid').val('');
    $('#txtpassword').val('');
    $('#hdnuid').val('');
    $('#hdnpass').val('');
    $("#txtmsg").val('');
    $('#divwelcome').html('');
    $('#dvchatmsg').html('');
    $('#contact-list').html('');
}


//start of Js user defined functions
function getUserByUserId(uid) {
    var objuser = null;
    var _iloop = 0;
    jQuery.each(userlist, function (_iloop, val) {
        if (val.userid == uid) {
            objuser = val;
        }
    });

    return objuser;
}


function contactclick(ctrl) {
    var id = ctrl.id.replace("Aclnt-", "");

    var _iloop = 0;
    jQuery.each(userlist, function (_iloop, val) {
        if (val.identid == id) {
            $('#spanchatwithpersn').html(val.userid);
        }
    });

}
//end of Js user defined functions

 
   