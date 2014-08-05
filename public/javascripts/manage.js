/**
 * Created by yarvyk on 04.08.2014.
 */

(function($) {
    $.manage = {};

    // Models


    $.manage.User = Backbone.Model.extend({
        urlRoot: '/api/newUser',
        defaults: {
            login: '',
            password: ''
        },
        initialize: function() {
            console.log('User initialized');
        },
        login: function(attributes, callback){
            this.save(attributes, callback);
            this.unset('password');
        }
    });

    $.manage.BannedIp = Backbone.Model.extend({
        urlRoot: '/api/newBannedIp',
        defaults: {
            ip: ''
        },
        initialize: function() {
            console.log('BannedIp initialized');
        },
        banIp: function(attributes, callback){
            this.save(attributes, callback);
        }
    });

    // Views

    $.manage.RestartButton = Backbone.View.extend({
        tagName: 'div',
        className: 'restartGameButton',
        events: {
            "click": "clicked"
        },
        clicked: function(){
            console.log("going to restart");
            $.manage.app.doRestart();
        },
        buttonTemplate: _.template("[restart]"),
        render: function() {
            this.$el.empty();
            this.$el.append(this.buttonTemplate());
            return this;
        }
    });
    $.manage.InputLoginView = Backbone.View.extend({
        tagName: 'input',
        className: 'inputView',
        initialize: function(){
            //this.$el.attr('contentEditable',true);
            this.$el.attr('name','login');
            this.$el.attr('placeholder','new login');

            this.$el.attr('pattern','.{3,16}');
            this.$el.attr('required', true);
            this.$el.attr('title', 'min 3, max 16');
            //this.listenTo(this.options.parent.model, "change:names", this.listener);
        },
        render: function(){
            this.$el.empty();
            //this.$el.append("asdf");
            return this;
        }
    });
    $.manage.InputPasswordView = Backbone.View.extend({
        tagName: 'input',
        className: 'inputPasswordView',
        initialize: function(){
            //this.$el.attr('type','password');
            this.$el.attr('name','password');
            this.$el.attr('placeholder','new password');

            this.$el.attr('pattern','.{4,16}');
            this.$el.attr('required', true);
            this.$el.attr('title', 'min 4, max 16');
        },
        render: function(){
            this.$el.empty();
            return this;
        }
    });
    $.manage.InputSubmitView = Backbone.View.extend({
        tagName: 'input',
        className: 'inputSubmitView',
        initialize: function(){
            this.$el.attr('type','submit');
            this.$el.attr('value','[submit]');

            // impossible for mobile devices =/
            //this.$el.css('display','none');
        },
        buttonTemplate: _.template("[submit]"),
        render: function() {
            this.$el.empty();
            this.$el.append(this.buttonTemplate());
            return this;
        }
    });
    $.manage.InputFormView = Backbone.View.extend({
        tagName: 'form',
        id: 'auth',
        //className: 'inputPasswordView',

        initialize: function () {
            this.initViews();

            this.render();
        },
        initViews: function(){
            this.inputLoginView = new $.manage.InputLoginView();
            this.inputLoginView.render();

            this.inputPasswordView = new $.manage.InputPasswordView();
            this.inputPasswordView.render();

            this.inputSubmitView = new $.manage.InputSubmitView();
            this.inputSubmitView.render();
        },

        events : {
            // https://developer.mozilla.org/en-US/docs/Web/Events
            //"change" : "change",
            "submit" : "newUser"
        },
        newUser : function(event) {
            var self = this;

            console.log('trying to create new user');
            event.preventDefault();

            this.model.set({
                login: this.el.elements["login"].value,
                password: this.el.elements["password"].value
            });

            this.model.login(null, {
                success: function(model,values) {
                    console.log("User created", model, values);
                    alert("User created");

                    //self.el.elements["login"].value.clear();
                    //self.el.elements["password"].value.clear();

                    self.render();
                },
                error: function( model, response) {
                    console.log("Could not create user:", response);
                    alert("Could not create user, no permission");
                }
            });
            event.currentTarget.checkValidity();
            return false;
        },
        titleTemplate: _.template("<div>Add user (leaf):</div>"),
        render: function(){
            this.$el.empty();

            this.$el.append(this.titleTemplate());

            this.$el.append(this.inputLoginView.el);
            this.$el.append("<br>");
            this.$el.append("<br>");
            this.$el.append(this.inputPasswordView.el);
            this.$el.append("<br>");
            this.$el.append("<br>");
            this.$el.append(this.inputSubmitView.el);

            return this;
        }
    });

    $.manage.InputBannedIpView = Backbone.View.extend({
        tagName: 'input',
        className: 'inputBannedIpView',
        initialize: function(){
            this.$el.attr('name','ip');
            this.$el.attr('placeholder','banned ip');

            this.$el.attr('pattern','.{7,15}');
            this.$el.attr('required', true);
            this.$el.attr('title', 'IPv4 address, example: 198.18.255.11');
        },
        render: function(){
            this.$el.empty();
            return this;
        }
    });
    $.manage.InputFormBannedIpView = Backbone.View.extend({
        tagName: 'form',
        id: 'bannedIp',

        initialize: function () {
            this.initViews();

            this.render();
        },
        initViews: function(){
            this.inputBannedIpView = new $.manage.InputBannedIpView();
            this.inputBannedIpView.render();

            this.inputSubmitView = new $.manage.InputSubmitView();
            this.inputSubmitView.render();
        },

        events : {
            // https://developer.mozilla.org/en-US/docs/Web/Events
            //"change" : "change",
            "submit" : "newBannedIp"
        },
        newBannedIp : function(event) {
            var self = this;

            console.log('trying to add new banned ip');
            event.preventDefault();

            this.model.set({
                ip: this.el.elements["ip"].value
            });

            this.model.banIp(null, {
                success: function(model,values) {
                    console.log("Ip was successfully banned", model, values);
                    alert("Ip was successfully banned");

                    //self.el.elements["ip"].value.clear();

                    self.render();
                },
                error: function( model, response) {
                    console.log("Could not ban ip:", response);
                    alert("Could not ban ip, no permission");
                }
            });
            event.currentTarget.checkValidity();
            return false;
        },
        titleTemplate: _.template("<div>Ban ip:</div>"),
        render: function(){
            this.$el.empty();

            this.$el.append(this.titleTemplate());

            this.$el.append(this.inputBannedIpView.el);
            this.$el.append("<br>");
            this.$el.append("<br>");
            this.$el.append(this.inputSubmitView.el);

            return this;
        }
    });

    // Router

    // looks like main application class
    $.manage.Router = Backbone.Router.extend({
        routes: {
            "manage": "manage"
        },
        initialize: function(){
            console.log("1. app init");
        },

        manage: function(){
            console.log("2. app route");

            var $body = $('body');

            this.userModel = new $.manage.User();
            var inputFormView = new $.manage.InputFormView({model: this.userModel});
            $body.append(inputFormView.render().el);

            this.bannedIpModel = new $.manage.BannedIp();
            var inputFormBannedIpView = new $.manage.InputFormBannedIpView({model: this.bannedIpModel});
            $body.append(inputFormBannedIpView.render().el);
        }
    });

    // App

    $.manage.app = null;

    $.manage.bootstrap = function(){
        $.manage.app = new $.manage.Router();
        Backbone.history.start({pushState: true});
    };
})(jQuery);