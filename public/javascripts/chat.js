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
            // localStorage - sync values among all tabs
            // sessionStorage - keep values only in one tab
            //this.storage = localStorage; //document.cookie; //localStorage; //sessionStorage;

            //this.updateRate = 1000; // ms
            //this.lastUpdateTime = 0;

            this.restartListener();
            //this.statusChanged();
        },

        restartListener: function(){
            console.log("nothing is here");
            this.stopListening();
            //this.listenTo(this, 'change:status', this.statusChanged);
            //this.listenTo(this, 'change:rerolled', this.statusChanged);

            this.listenTo(this.attributes.userModel, 'change:name', this.listener);
        },
        listener: function(){
            $('body').append("there will be chat soon");
        }

        /*statusChanged: function(){
            console.log("nothing is here right now");
            console.log("status changed");
            var needUpdate = true;
            var status = this.attributes.status;
            if (status == 0) {
                this.urlRoot = '/api/connectPlayer';
                this.restartListener();
            } else if (status == 20) {
                this.updateDices();
                this.urlRoot = '/api/rounds/' + this.attributes._id;
            } else {
                needUpdate = false;
                console.warn("unknown game status:",this.attributes.status, this);
            }
            if (needUpdate){
                this.updateModel();
            }
        },
        */
        /*
        updateModel: function(){
            console.log("nothing is here");
            var self = this;
            // if there are urlRoot and attributes.id it will be fetched urlRoot + / + id
            if (this.attributes.status != 20) {
                console.log("going to fetch", this.urlRoot);
            }
            this.fetch({
                success: function(mdl, values){
                    //console.log("fetched:", mdl, values);
                    var status = self.attributes.status;
                    if (status == 0) {
                        self.changeStatus(10);
                    } else if (status == 10) {
                        if (new Date() - self.lastUpdateTime > self.updateRate) {
                            self.lastUpdateTime = new Date();
                            setTimeout(function () {
                                self.updateModel();
                            }, self.updateRate);
                        } else {
                            console.log("going to update too early", status);
                        }
                    } else if (status == 20) {
                        //console.log("process fetched:", mdl, values);
                        // there were a problem about twice fetching, but with this if it looks fine
                        if (new Date() - self.lastUpdateTime > self.updateRate) {
                            self.lastUpdateTime = new Date();
                            setTimeout(function(){
                                self.updateModel();
                            }, self.updateRate);
                        } else {
                            console.log("going to update too early", status);
                        }
                    } else if (status == 90) {
                        if (self._previousAttributes.status == 70) {
                            self.changeStatus(0);
                        }
                        // refresh (f5) behaviour when game already ended
                        if (self.attributes.combinations.length == 0) {
                            var ind = self.getOwnPlayerIndex();
                            var rlen = self.attributes.rounds[ind].length;
                            self.setDices(self.attributes.rounds[ind][rlen-1].dices);
                        }
                    }
                },
                error: function(mdl, values, xhr){
                    var status = self.attributes.status;
                    console.warn("actually error", status);
                    if (status == 10) {
                        if (values.status == 200) {
                            console.warn("there were case with fetching here, but now it's moved to success");
                        } else {
                            console.error("Connection eRRoRR", mdl, values, xhr);
                        }
                    } else if (status == 70) {
                        self.changeStatus(0);
                    } else if (status == 90) {
                        if (self._previousAttributes.status == 70) {
                            self.changeStatus(0);
                        }
                    } else {
                        console.error("Connection error", mdl, values, xhr);
                    }
                }
            });
        },
        */

        /*
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
        */
    });
    $.chat.User = Backbone.Model.extend({
        urlRoot: '/auth',
        defaults: {
            login: '',
            password: ''
        },

        initialize: function() {
            console.log('user initialized');
        },

        login: function(attributes, callback){
            this.save(attributes, callback);
            this.unset('password');
        }
    });
    $.chat.SocketIO = Backbone.Model.extend({
        defaults: {
            socket: null
        },
        initialize: function() {
            console.log('io initializing');

            //this.socket = io.connect('http://' + $.chat.host);
            //this.initializeSocketIO();

            this.init();
        },

        initializeSocketIO: function(){
            console.log("1.1. socket.io init");
            this.socket.on('connect', (function () {
                console.log("socket connected");
                //this.socket.emit('join', 'students');
            }).bind(this));
            this.socket.on('jjoin', function (message) {
                console.log("client jjoin", message);
            });

        },

        // socket io example
        init: function(){
            var self = this;

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
            this.$currentInput = this.$usernameInput.focus();

            this.socket = io();

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
                        self.setUsername();
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

            this.socket.on('login', function (data) {
                self.connected = true;
                // Display the welcome message
                var message = "Welcome to Socket.IO Chat &mdash; ";
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
        setUsername: function(){
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
        },

        // Sends a chat message
        sendMessage: function(){
            var message = this.$inputMessage.val();
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
    $.chat.NamesView = Backbone.View.extend({
        tagName: 'div',
        className: 'namesView',
        initialize: function(){
            this.listenTo(this.model, "change:names", this.listener);
        },
        listener: function(){
            this.render();
        },
        events: {
            "click": "clicked"
        },
        clicked: function(e){
            console.log("names:", e.target.title, this.model.attributes.names, e);
            $.chat.app.doViewAnotherModel(parseInt(e.target.title));
        },
        nameTemplate: _.template('<span title="<%= index %>"> <%= name %> </span>'),
        ownNameTemplate: _.template('<b><span title="<%= index %>"> <%= name %> </span></b>'),
        render: function(){
            this.$el.empty();
            if (this.model.attributes != null && this.model.attributes.names != null) {
                var ownIndex = this.model.getOwnPlayerIndex();
                for (var i = 0; i < this.model.attributes.names.length; i++){
                    if (i == ownIndex){
                        this.$el.append(this.ownNameTemplate({name: this.model.attributes.names[i], index: i}));
                    } else {
                        this.$el.append(this.nameTemplate({name: this.model.attributes.names[i], index: i}));
                    }
                }
            }
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
            this.$el.attr('method','post');
            this.$el.attr('action','/auth');

            this.initViews();

            this.render();
        },
        initViews: function(){
            this.inputLoginView = new $.chat.InputLoginView({model: this.linesModel});
            this.inputLoginView.render();

            this.inputPasswordView = new $.chat.InputPasswordView({model: this.linesModel});
            this.inputPasswordView.render();

            this.inputSubmitView = new $.chat.InputSubmitView({model: this.linesModel});
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
                this.$el.append(this.inputLoginView.el);
                this.$el.append("<br>");
                this.$el.append("<br>");
                this.$el.append(this.inputPasswordView.el);
                this.$el.append("<br>");
                this.$el.append("<br>");
                this.$el.append(this.inputSubmitView.el);
            }
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

            this.socket = new $.chat.SocketIO();
        },

        chat: function(){
            console.log("2. app route");

            var $body = $('body');

            //var nameView = new $.chat.NamesView({model: this.linesModel});
            //$body.append(nameView.render().el);

            //var inputLoginView = new $.chat.InputLoginView({model: this.linesModel});
            //$body.append(inputLoginView.render().el);

            //var inputPasswordView = new $.chat.InputPasswordView({model: this.linesModel});
            //$body.append(inputPasswordView.render().el);

            this.userModel = new $.chat.User();
            var inputFormView = new $.chat.InputFormView({model: this.userModel});
            $body.append(inputFormView.render().el);

            this.linesModel = new $.chat.Lines({userModel: this.userModel});

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