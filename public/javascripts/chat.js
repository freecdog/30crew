/**
 * Created by jaric on 31.07.14.
 */

(function($) {
    $.chat = {};

    // Models

    $.chat.Lines = Backbone.Model.extend({
        urlRoot: '/api/dices',
        //idAttribute: 'id',
        defaults: {
            '_id':  null,
            status: 0
        },

        initialize: function() {
            this.restartListener();
        },

        restartListener: function(){
            console.log("nothing is here");
            this.stopListening();

            this.listenTo(this.attributes.userModel, 'change:name', this.listener);
        },
        listener: function(){
            $('body').append("there will be chat soon");
        }
    });
    $.chat.User = Backbone.Model.extend({
        urlRoot: '/api/auth',
        defaults: {
            login: '',
            name: '',
            password: '',
            ready: false
        },

        initialize: function() {
            // localStorage - sync values among all tabs
            // sessionStorage - keep values only in one tab
            this.storage = localStorage; //document.cookie; //localStorage; //sessionStorage;

            console.log('user initialized');
        },

        login: function(attributes, callback){
            this.save(attributes, callback);
            this.unset('password');
        },

        // storage
        addValue: function(name,value){
            this.storage.setItem(name, value);
        },
        getValue: function(name){
            return this.storage.getItem(name);
        },
        existValue: function(name){
            return this.storage.getItem(name) != null;
        },
        removeValue: function(name){
            this.storage.removeItem(name);
        }
    });

    // TODO, clean up css (what is the bug with "font-weight: 700" bold in chrome?)
    // TODO, manage channels
    // TODO, chat moderation
    // TODO, user font change posibility
    // TODO, anti DDOS is needed, actually with huge Paste data

    $.chat.SocketIO = Backbone.Model.extend({
        defaults: {
            socket: null
        },
        initialize: function() {
            //this.init();

            // actually userModel
            this.listenTo(this.attributes.model, 'change:name', this.userNameChanged);
        },
        userNameChanged: function(){
            console.log("userNameChanged", this.attributes.model.attributes.name);
            this.init();
        },

        init: function(){
            console.log('io initializing', this);

            // TODO, it doesn't looks like good MVC practice
            $.chat.app.$body.append($.chat.app.chatView.render().el);

            this.initVars();
            this.initEvents();
            this.initSocketIOEvents();

            this.setUsername(this.attributes.model.attributes.name);
        },

        initVars: function(){

            this.FADE_TIME = 150; // ms
            this.TYPING_TIMER_LENGTH = 400; // ms
            this.COLORS = [
                '#e21400', '#91580f', '#f8a700', '#f78b00',
                '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
                '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
            ];

            // Initialize varibles
            this.$window = $(window);
            this.$usernameInput = $('.usernameInput'); // Input for username
            this.$messages = $('.messages'); // Messages area
            this.$inputMessage = $('.inputMessage'); // Input message input box

            this.$loginPage = $('.login.page'); // The login page
            this.$chatPage = $('.chat.page'); // The chatroom page

            // Prompt for setting a username
            this.username = null; //"username " + Math.round(Math.random()*100);
            this.connected = false;
            this.typing = false;
            this.lastTypingTime = null;
            //this.$currentInput = this.$usernameInput.focus();
            this.$currentInput = this.$inputMessage.focus();
        },

        initEvents: function(){
            var self = this;

            this.$window.keydown(function (event) {
                // Auto-focus the current input when a key is typed
                if (!(event.ctrlKey || event.metaKey || event.altKey)) {
                    self.$currentInput.focus();
                }
                // When the client hits ENTER on their keyboard
                if (event.which === 13) {
                    if (self.username) {
                        self.sendMessage();
                        self.socket.emit('stop typing');
                        self.typing = false;
                    } else {
                        console.log("not used now");
                        //self.setUsername();
                    }
                }
            });

            this.$inputMessage.on('input', function() {
                self.updateTyping();
            });

            // Click events

            // Focus input when clicking anywhere on login page
            self.$loginPage.click(function () {
                self.$currentInput.focus();
            });

            // Focus input when clicking on the message input's border
            this.$inputMessage.click(function () {
                self.$inputMessage.focus();
            });
        },

        initSocketIOEvents: function(){
            var self = this;

            this.socket = io();

            this.socket.on('j', function (data) {
                console.log("jClient" + data);
            });

            this.socket.on('login', function (data) {
                self.connected = true;
                // Display the welcome message
                var message = 'Welcome to "leaves" chat!';
                self.log(message, {
                    prepend: true
                });
                self.addParticipantsMessage(data);
            });

            // Whenever the server emits 'new message', update the chat body
            this.socket.on('new message', function (data) {
                self.addChatMessage(data);
            });

            // Whenever the server emits 'user joined', log it in the chat body
            this.socket.on('user joined', function (data) {
                self.log(data.username + ' joined');
                self.addParticipantsMessage(data);
            });

            // Whenever the server emits 'user left', log it in the chat body
            this.socket.on('user left', function (data) {
                self.log(data.username + ' left');
                self.addParticipantsMessage(data);
                self.removeChatTyping(data);
            });

            // Whenever the server emits 'typing', show the typing message
            this.socket.on('typing', function (data) {
                self.addChatTyping(data);
            });

            // Whenever the server emits 'stop typing', kill the typing message
            this.socket.on('stop typing', function (data) {
                self.removeChatTyping(data);
            });
        },

        addParticipantsMessage: function(data){
            var message = '';
            if (data.numUsers === 1) {
                message += "there's 1 participant";
            } else {
                message += "there're " + data.numUsers + " participants";
            }
            this.log(message);
        },

        // Sets the client's username
        setUsername: function(specialName){
            console.log("setting username", specialName);
            if (specialName){
                console.log("special username ofc");
                this.username = specialName;

                this.$loginPage.fadeOut();
                this.$chatPage.show();
                //this.$chatPage.css("display", "list-item");
                this.$loginPage.off('click');
                this.$currentInput = this.$inputMessage.focus();

                // Tell the server your username
                this.socket.emit('add user', this.username);
            } else {
                this.username = this.cleanInput(this.$usernameInput.val().trim());

                // If the username is valid
                if (this.username) {
                    this.$loginPage.fadeOut();
                    this.$chatPage.show();
                    this.$loginPage.off('click');
                    this.$currentInput = this.$inputMessage.focus();

                    // Tell the server your username
                    this.socket.emit('add user', this.username);
                }
            }
        },

        // Sends a chat message
        sendMessage: function(){
            var message = this.$inputMessage.val();
            if (message.length > 250) {
                console.log("too much symbols to this chat (<250)");
                alert("too much symbols to this chat (<250)");
                return;
            }
            // Prevent markup from being injected into the message
            message = this.cleanInput(message);
            // if there is a non-empty message and a socket connection
            if (message && this.connected) {
                this.$inputMessage.val('');
                this.addChatMessage({
                    username: this.username,
                    message: message
                });
                // tell server to execute 'new message' and send along one parameter
                this.socket.emit('new message', message);
            }
        },

        // Log a message
        log: function(message, options){
            var $el = $('<li>').addClass('log').text(message);
            this.addMessageElement($el, options);
        },

        // Adds the visual chat message to the message list
        addChatMessage: function(data, options){
            // Don't fade the message in if there is an 'X was typing'
            var $typingMessages = this.getTypingMessages(data);
            options = options || {};
            if ($typingMessages.length !== 0) {
                options.fade = false;
                $typingMessages.remove();
            }

            var $usernameDiv = $('<span class="username"/>')
                .text(data.username)
                .css('color', this.getUsernameColor(data.username));
            var $messageBodyDiv = $('<span class="messageBody">')
                .text(data.message);

            var typingClass = data.typing ? 'typing' : '';
            var $messageDiv = $('<li class="message"/>')
                .data('username', data.username)
                .addClass(typingClass)
                .append($usernameDiv, $messageBodyDiv);

            this.addMessageElement($messageDiv, options);
        },

        // Adds the visual chat typing message
        addChatTyping: function(data){
            data.typing = true;
            data.message = 'is typing';
            this.addChatMessage(data);
        },

        // Removes the visual chat typing message
        removeChatTyping: function(data){
            this.getTypingMessages(data).fadeOut(function () {
                $(this).remove();
            });
        },

        // Adds a message element to the messages and scrolls to the bottom
        // el - The element to add as a message
        // options.fade - If the element should fade-in (default = true)
        // options.prepend - If the element should prepend
        //   all other messages (default = false)
        addMessageElement: function(el, options){
            var $el = $(el);

            // Setup default options
            if (!options) {
                options = {};
            }
            if (typeof options.fade === 'undefined') {
                options.fade = true;
            }
            if (typeof options.prepend === 'undefined') {
                options.prepend = false;
            }

            // Apply options
            if (options.fade) {
                $el.hide().fadeIn(this.FADE_TIME);
            }
            if (options.prepend) {
                this.$messages.prepend($el);
            } else {
                this.$messages.append($el);
            }
            this.$messages[0].scrollTop = this.$messages[0].scrollHeight;
        },

        // Prevents input from having injected markup
        cleanInput: function(input){
            return $('<div/>').text(input).text();
        },

        // Updates the typing event
        updateTyping: function(){
            var self = this;
            if (this.connected) {
                if (!this.typing) {
                    this.typing = true;
                    this.socket.emit('typing');
                }
                this.lastTypingTime = (new Date()).getTime();

                setTimeout(function () {
                    var typingTimer = (new Date()).getTime();
                    var timeDiff = typingTimer - self.lastTypingTime;
                    if (timeDiff >= self.TYPING_TIMER_LENGTH && self.typing) {
                        self.socket.emit('stop typing');
                        self.typing = false;
                    }
                }, this.TYPING_TIMER_LENGTH);
            }
        },

        // Gets the 'X is typing' messages of a user
        getTypingMessages: function(data){
            return $('.typing.message').filter(function (i) {
                return $(this).data('username') === data.username;
            });
        },

        // Gets the color of a username through our hash function
        getUsernameColor: function(username){
            // Compute hash code
            var hash = 7;
            for (var i = 0; i < username.length; i++) {
                hash = username.charCodeAt(i) + (hash << 5) - hash;
            }
            // Calculate color
            var index = Math.abs(hash % this.COLORS.length);
            return this.COLORS[index];
        }
    });

    // Views

    $.chat.RestartButton = Backbone.View.extend({
        tagName: 'div',
        className: 'restartGameButton',
        events: {
            "click": "clicked"
        },
        clicked: function(){
            console.log("going to restart");
            $.chat.app.doRestart();
        },
        buttonTemplate: _.template("[restart]"),
        render: function() {
            this.$el.empty();
            this.$el.append(this.buttonTemplate());
            return this;
        }
    });
    $.chat.InputLoginView = Backbone.View.extend({
        tagName: 'input',
        className: 'inputView',
        initialize: function(){
            //this.$el.attr('contentEditable',true);
            this.$el.attr('name','login');
            this.$el.attr('placeholder','login');

            this.$el.attr('pattern','.{2,16}');
            this.$el.attr('required', true);
            this.$el.attr('title', 'min 2, max 16');
            //this.listenTo(this.options.parent.model, "change:names", this.listener);
        },
        listener: function(){
            //this.setValue(this.getName(this.options.parent.model));
        },
        events: {
            // https://developer.mozilla.org/en-US/docs/Web/Events
            "input": "clicked"
        },
        clicked: function(event){
            console.log(this.getValue());
        },
        getValue: function(){
            return this.$el[0].textContent;
        },
        setValue: function(value){
            this.$el[0].textContent = value;
        },
        render: function(){
            this.$el.empty();
            //this.$el.append("asdf");
            return this;
        }
    });
    $.chat.InputPasswordView = Backbone.View.extend({
        tagName: 'input',
        className: 'inputPasswordView',
        initialize: function(){
            this.$el.attr('type','password');
            this.$el.attr('name','password');
            this.$el.attr('placeholder','password');

            this.$el.attr('pattern','.{4,16}');
            this.$el.attr('required', true);
            this.$el.attr('title', 'min 4, max 16');
            //this.listenTo(this.options.parent.model, "change:names", this.listener);
        },
        listener: function(){
            //this.setValue(this.getName(this.options.parent.model));
        },
        events: {
            // https://developer.mozilla.org/en-US/docs/Web/Events
            "input": "clicked"
        },
        clicked: function(){//event){
            console.log(this.getValue());
        },
        getValue: function(){
            return this.$el[0].textContent;
        },
        setValue: function(value){
            this.$el[0].textContent = value;
        },
        render: function(){
            this.$el.empty();
            //this.$el.append("asdf");
            return this;
        }
    });
    $.chat.InputSubmitView = Backbone.View.extend({
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
    $.chat.InputFormView = Backbone.View.extend({
        tagName: 'form',
        id: 'auth',
        //className: 'inputPasswordView',

        initialize: function () {
            //this.$el.attr('method','post');
            //this.$el.attr('action','/api/auth');

            this.initViews();

            this.render();
        },
        initViews: function(){
            this.inputLoginView = new $.chat.InputLoginView();
            this.inputLoginView.render();

            this.inputPasswordView = new $.chat.InputPasswordView();
            this.inputPasswordView.render();

            this.inputSubmitView = new $.chat.InputSubmitView();
            this.inputSubmitView.render();
        },

        events : {
            // https://developer.mozilla.org/en-US/docs/Web/Events
            //"change" : "change",
            "submit" : "login"
        },
        login : function( event) {
            var self = this;

            console.log('trying to login');
            event.preventDefault();

            this.model.set({
                login: this.el.elements["login"].value,
                password: this.el.elements["password"].value
            });
            this.el.elements["password"].value = '';

            this.model.login(null, {
                success: function(model,values) {
                    console.log("User logged in", model, values);
                    self.auth = true;

                    self.model.addValue("auth", JSON.stringify(model.attributes));

                    self.render();
                },
                error: function( model, response) {
                    console.log("Could not login user: " + response.error_description);
                }
            });
            event.currentTarget.checkValidity();
            return false;
        },

        listener: function(){
            //this.setValue(this.getName(this.options.parent.model));
        },
        clicked: function(event){
            console.log(this.getValue());
        },
        getValue: function(){
            return this.$el[0].textContent;
        },
        setValue: function(value){
            this.$el[0].textContent = value;
        },
        render: function(){
            this.$el.empty();
            if (this.auth) {
                console.log("login form out");
            } else {
                var img = $('<img/>', {
                    class: 'logoImage'
                }).appendTo(this.$el);
                this.$el.append("<br>");

                var linkPromo = $('<a/>', {
                    href: '/registration',
                    class: 'indexAnchor jGreen'
                });
                linkPromo.append("Registration");
                this.$el.append(linkPromo);
                this.$el.append("<br>");

                this.$el.append(this.inputLoginView.el);
                //this.$el.append("<br>");
                this.$el.append("<br>");
                this.$el.append(this.inputPasswordView.el);
                //this.$el.append("<br>");
                this.$el.append("<br>");
                this.$el.append(this.inputSubmitView.el);
                this.$el.append("<br>");
            }
            return this;
        }
    });
    $.chat.ChatView = Backbone.View.extend({
        tagName: 'ul',
        className: 'pages',
        initialize: function(){
            this.listenTo(this.model, "change:name", this.listener);
        },
        listener: function(){
            this.render();
        },
        chatPageTemplate: _.template('<li class="chat page"> </li>'),
        chatAreaTemplate: _.template('<div class="chatArea"> </div>'),
        messagesTemplate: _.template('<ul class="messages"> </ul>'),
        inputMessageTemplate: _.template('<input class="inputMessage" placeholder="Type here...">'),
        render: function(){
            this.$el.empty();

            var chatPage = this.chatPageTemplate();
            var chatArea = this.chatAreaTemplate();
            var messages = this.messagesTemplate();
            var inputMessage = this.inputMessageTemplate();

            this.$el.append(chatPage);
            {
                var chatPageElement = this.$el.find('.chat.page');
                chatPageElement.append(chatArea);
                {
                    this.$el.find('.chatArea').append(messages);
                }
                chatPageElement.append(inputMessage);
            }

            console.log("elements rendered");

            return this;
        }
    });

    // Router

    // looks like main application class
    $.chat.Router = Backbone.Router.extend({
        routes: {
            "": "chat"
        },
        initialize: function(){
            console.log("1. app init");
        },

        chat: function(){
            console.log("2. app route");

            this.$body = $('body');

            this.userModel = new $.chat.User();
            var inputFormView = new $.chat.InputFormView({model: this.userModel});
            this.$body.append(inputFormView.render().el);

            this.chatView = new $.chat.ChatView({model: this.userModel});
            //this.$body.append(this.chatView.render().el);

            this.socket = new $.chat.SocketIO({model: this.userModel});

            //this.linesModel = new $.chat.Lines({userModel: this.userModel});

        },

        doRestart: function(index){
            this.linesModel.restart(index);
        }
    });

    // App

    $.chat.app = null;

    $.chat.bootstrap = function(){
        $.chat.app = new $.chat.Router();
        Backbone.history.start({pushState: true});
    };
})(jQuery);