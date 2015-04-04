/**
 * GitHub Game Off 2015
 * "Business Frog Jumps to Conclusions"
 * by Casey Leonard <casey@amphibian.com>
 * 
 * Forked from:
 *     Octocat Jump
 *     A Github Game Off 2012 Entry
 *     @copyright Omer Goshen <gershon@goosemoose.com>
 */
(function octocatJump($, Crafty) {
    $(document).ready(function documentReady() {
    	
    	var TASK_COLOR = "#3399FF";
    	var CP_TASK_COLOR = "#FF0000";
    	var MAJOR_TASK_COLOR = "#000000";
    	var BG_COLOR = "#FFFFFF";
    	var OVERLAY_ALPHA = 0.3;
    	var PLATFORM_HEIGHT = 20;
    	var MAJOR_PLATFORM_HEIGHT = 10;
    	
        var STAGE_WIDTH = 400,
            STAGE_HEIGHT = 640,
            SCROLL_SPEED = 1,
            GRAVITY = 1,
            SFX = true,
            level_data = [],
            score = 0,
            stars = 0,
            forks = 0,
            criticalPathCounter = 0,
            lastCriticalPath = -2,
            criticalPathBonus = 1,
            hoopBonus = 0;
            n = 10,
            isDead = false;

        Crafty.init(STAGE_WIDTH, STAGE_HEIGHT);
        Crafty.canvas.init();
        Crafty.viewport.init(STAGE_WIDTH, STAGE_HEIGHT);
        Crafty.settings.modify("autoPause", true);

        function initLevel() {
            var i = 0;
            level_data = [{
                x: Crafty.viewport.width / 2 - 50,
                y: Crafty.viewport.height - 50,  
                w: 100,
                z: 50,
                h: PLATFORM_HEIGHT
            }];

            for(i = 0; i < 10000; i++) {
                level_data.push({
                    x: ~~ (Math.random() * (Crafty.viewport.width - 100)),
                    y: -Crafty.viewport.y + Crafty.viewport.height - i * 100,
                    w: 50 + 50 * Math.random(),
                    h: PLATFORM_HEIGHT,
                    z: 50,
                    num: i
                });
            }
        }
        initLevel();

        Crafty.c("RingSide", {
        	init: function() {
        		this._canHit = false;
        		this._owner = null;
        	},
            useRing: function() {
            	if (this._owner) {
            		this._owner.use();
            	}
            },
            spinRing: function() {
            	if (this._owner) {
            		this._owner.spin();
            	}
            }
        });
        
        Crafty.c("Ring", {

            init: function () {
            	
            	this._canHit = false;
            	
        		this.x = (Crafty.viewport.width - 240) * Math.random();
        		this.y = -Crafty.viewport.y - 100;

            	var rx = this._x;
            	var ry = this._y;
            	
                this._ringBack = Crafty.e("2D, DOM, Image").attr({
                	x: rx,
                	y: ry,
                    z: 1
                }).image("assets/images/ring_back.png");

                this._ringFront = Crafty.e("2D, DOM, Image").attr({
                	x: rx,
                	y: ry,
                    z: 1000
                }).image("assets/images/ring_front.png");
            	
                this.attach(this._ringBack);
                this.attach(this._ringFront);
                
                
                this._ringLeftSide = Crafty.e("2D, Collision, RingSide").attr({
                    x: rx,
                    y: ry,
                    w: 30,
                    h: 60
                }).onHit("Player", onHitRingSide);

                this._ringRightSide = Crafty.e("2D, Collision, RingSide").attr({
                    x: rx + 220,
                    y: ry,
                    w: 30,
                    h: 60
                }).onHit("Player", onHitRingSide);
                
                
                this._ringMiddle = Crafty.e("2D, Collision, RingSide").attr({
                    x: rx + 95,
                    y: ry,
                    w: 50,
                    h: 1
                }).onHit("Player", onHitRing);
                
                this._ringLeftSide._owner = this;
                this._ringRightSide._owner = this;
                this._ringMiddle._owner = this;
                
                this.turnOn();
                
                this.bind("EnterFrame", this._enterframe);
            	
            },
            
            turnOff: function() {
            	this._canHit = false;
            	this._ringMiddle._canHit = false;
            	this._ringLeftSide._canHit = false;
            	this._ringRightSide._canHit = false;
            },

            turnOn: function() {
            	this._canHit = true;
            	this._ringMiddle._canHit = true;
            	this._ringLeftSide._canHit = true;
            	this._ringRightSide._canHit = true;
            },

            use: function() {

        		this.turnOff();

            	if(SFX) Crafty.audio.play('hoop', 1, 1);
            	
            	this.tween({
            		y: this._y + 400
            	}, 600).bind("TweenEnd", function (k) {
            		this._ringBack.attr({
            			alpha: 0
            		});
            		this._ringFront.attr({
            			alpha: 0
            		});
            	}, 5);

            
            
            },
            
            spin: function() {

        		this.turnOff();

            	if(SFX) Crafty.audio.play('spin', 1, 1);
            	
            	this.tween({
            		rotation: 360
            	}, 700).bind("TweenEnd", function (k) {
            		this._ringBack.attr({
            			alpha: 0
            		});
            		this._ringFront.attr({
            			alpha: 0
            		});
            	}, 5);
            	
            },
            
            _enterframe: function () {
            	if (this._y > (-Crafty.viewport.y + Crafty.viewport.height)) {
            		this._ringMiddle.destroy();
            		this._ringLeftSide.destroy();
            		this._ringRightSide.destroy();
            		this.destroy();
            	}
            }


        });
        
        Crafty.c("Apple", {
        	
        	_active: false,
        	_canHit: false,
        	
        	reset: function() {
            	this._dir = (Math.random() < 0.5 ? -1 : 1);
            	this.x = ( this._dir > 0 ? -(this._w) : (Crafty.viewport.width + (this._w)));
            	this.y = (Crafty.viewport.height / 4) - (Crafty.viewport.y);
            	this.z = 9999;
            	this.alpha = 1;
            	this._active = true;
            	this._canHit = true;
        	},
        	
            init: function () {
            	this.reset();
            	this.bind("EnterFrame", this._enterframe);
            },

            _enterframe: function () {
            	if (this._active) {
            		this.x = this._x + (this._dir * 4.5);
            	}
            	if (this._x < -(this._w*2) || this._x > Crafty.viewport.width + (this._w*2)) {
            		this._active = false;
            	}
            }
            
        });

        Crafty.c("Major", {

        	init: function () {
            	
                this.color(MAJOR_TASK_COLOR);
                this.h = MAJOR_PLATFORM_HEIGHT;

                this._leftCap = Crafty.e("2D, DOM, Image").attr({
                    x: this._x,
                    y: this._y
                }).image("assets/images/black_end_cap.png");

                this._rightCap = Crafty.e("2D, DOM, Image").attr({
                    x: this._x + (this._w - 1),
                    y: this._y
                }).image("assets/images/black_end_cap.png");

                this.attach(this._leftCap);
                this.attach(this._rightCap);
            
            },
            
            moveCap: function() {
            	this._rightCap.attr({
            		x: this._x + (this._w - 1)
            	});
            },

            use: function () {
            	
            	this._leftCap.destroy();
            	this._rightCap.destroy();
            	
                this.tween({
                    alpha: 0
                }, 25).bind("TweenEnd", function (k) {
                    if('alpha' !== k) {
                        return;
                    }
                    this.color("#888888");
                    this.removeComponent("Major");
                    this.h = PLATFORM_HEIGHT;
                });
                return this;
            }
        });

        Crafty.c("Critical", {
            _label: null,
            init: function () {
            	
                this.color(CP_TASK_COLOR);
                
                this._rightCap = Crafty.e("2D, DOM, Image").attr({
                    x: this._x + (this._w + 3),
                    y: this._y + (this._h / 2)
                }).image("assets/images/red_end_cap.png");

                this.attach(this._rightCap);
            
            },
            
            moveCap: function() {
            	this._rightCap.attr({
            		x: this._x + (this._w - 1)
            	});
            },

            use: function () {
            	this._rightCap.destroy();
                this.tween({
                    alpha: 0
                }, 25).bind("TweenEnd", function (k) {
                    if('alpha' !== k) {
                        return;
                    }
                    this.color("#888888");
                    this.removeComponent("Critical");
                });
                return this;
            }
        });

        Crafty.c("Pull", {
            _label: null,
            init: function () {
                this.color("#FF4444");
                this._label = Crafty.e("2D, DOM, Text").attr({
                    x: this.x,
                    y: this.y,
                    w: this.w
                }).textColor("#ffffff").textFont({
                	"family": "Sniglet",
                	"size": "18px"
                }).text("Pull").css({
                    "text-align": "center",
                    'textShadow': '0px 1px 2px rgba(0,0,0,.5), -1px -1px 0 #844,1px -1px 0 #844,-1px 1px 0 #844,1px 1px 0 #844'
                });
                this.attach(this._label);
            },

            use: function () {

            	this._label.destroy();

                this.tween({
                    alpha: 0
                }, 25).bind("TweenEnd", function (k) {
                    if('alpha' !== k) {
                        return;
                    }
                    this.color("#888888");
                    this.removeComponent("Pull");
                });
                return this;
            }
        });

        Crafty.c("PlayerControls", {
            _accel: new Crafty.math.Vector2D(),
            _speed: new Crafty.math.Vector2D(),
            _oldpos: new Crafty.math.Vector2D(),
            _enabled: true,
            ACCEL: 2,
            MAX_SPEED: 5,
            JUMP_HEIGHT: 22,
            PUSH_HEIGHT: 32,

            init: function () {
                this.requires("2D, Keyboard");

                this._accel = new Crafty.math.Vector2D();
                this._speed = new Crafty.math.Vector2D();
                this._oldpos = new Crafty.math.Vector2D();

                this.bind("KeyDown", function (e) {
                    switch(e.keyCode) {
                    case Crafty.keys.P:
                        Crafty.pause();
                        break;
                    case Crafty.keys.LEFT_ARROW:
                        this._accel.x = -this.ACCEL;
                        // this._accel.x = Math.max(this._accel.x - this.ACCEL, -this.ACCEL);
                        this.flip();
                        break;
                    case Crafty.keys.RIGHT_ARROW:
                        this._accel.x = +this.ACCEL;
                        // this._accel.x = Math.min(this._accel.x + this.ACCEL, this.ACCEL);
                        this.unflip();
                        break;
                    }
                });

                this.bind("KeyUp", function (e) {
                    switch(e.keyCode) {
                        // case Crafty.keys.LEFT_ARROW:
                        //     this._accel.x = Math.min(this._accel.x + this.ACCEL, this.ACCEL);
                        //     break;
                        // case Crafty.keys.RIGHT_ARROW:
                        //     this._accel.x = Math.max(this._accel.x - this.ACCEL, -this.ACCEL);
                        //     break;
                    case Crafty.keys.LEFT_ARROW:
                    case Crafty.keys.RIGHT_ARROW:
                        this._accel.x = 0;
                        break;
                    }
                });

                this.bind("EnterFrame", this._enterframe);
            },

            _enterframe: function () {
                if(!this._enabled) return;

                if(0 === this._accel.x) {
                    // this._speed.x *= 1 - Math.exp(-2);
                    this._speed.x *= 0.8646647167633873;
                }

                this._speed.x += this._accel.x;
                this._speed.y += this._accel.y + GRAVITY;

                this._speed.x = Math.max(-this.MAX_SPEED, Math.min(this._speed.x, this.MAX_SPEED));

                this._oldpos.x = this.x;
                this._oldpos.y = this.y;

                // var dr = {
                //     x: this.x - this._speed.x,
                //     y: this.y - this._speed.y
                // };
                // this.trigger('Moved', dr);
                if(0 !== this._speed.x) {
                    this.x += this._speed.x;
                    // this.trigger('Moved', {
                    //     x: this.x - this._speed.x,
                    //     y: this.y
                    // });
                }

                if(0 !== this._speed.y) {
                    this.y += this._speed.y;
                    // this.trigger('Moved', dr);
                    // this.trigger('Moved', {
                    //     x: this.x,
                    //     y: this.y - this._speed.y
                    // });
                }

                if(this.x < -this.w) this.x += Crafty.viewport.width + this.w;
                if(this.x > Crafty.viewport.width) this.x = -this.w;

            },

            enableControls: function () {
                this._enabled = true;
                return this;
            },
            disableControls: function () {
                this._enabled = false;
                return this;
            }
        });

        Crafty.scene("dead", function initDead() {
        	
        	Crafty.unbind("Pause");
        	Crafty.unbind("Unpause");
        	
            Crafty.viewport.y = 0;
            var s = 0,
                total = 0;
            Crafty.background("#fff");

            function starCounter(e) {
            	this.replace('<div style="text-align: center">' + 
            			'<img src="assets/images/coffee.png"/>' +
            			'<span style="color: #222; font: 36px Sniglet; margin-top: -12px; text-shadow: 0px 2px 4px rgba(0,0,0,.5)">' +
            			'<small>&nbsp;X&nbsp;</small>' + s + ' = ' + (s * 10) + '</span></div>' +
            			'<div style="text-align: center">' +
            			'<span style="color: #222; font: 36px Sniglet; margin-top: -12px; text-shadow: 0px 2px 4px rgba(0,0,0,.5)">' +
            			'Hoops<small>&nbsp;X&nbsp;</small>' + hoopBonus + ' = ' + (hoopBonus * 100) +
            			'</span></div>' +
            			'<div style="text-align: center">' +
            			'<span style="color: #222; font: 36px Sniglet; margin-top: -12px; text-shadow: 0px 2px 4px rgba(0,0,0,.5)">' +
            			'Critical Path = ' + criticalPathBonus + 'x' +
            			'</span></div>');

            	if(++s > stars) {
            		this.unbind("EnterFrame");

            		total = ((s - 1) * 10 + (hoopBonus * 100) + score) * criticalPathBonus;
            		Crafty.e("2D, DOM, HTML").attr({
            			x: 0,
            			y: 215,
            			w: Crafty.viewport.width
            		}).replace('<div style="text-align: center; font: 48px Sniglet, Impact; color: #222; text-shadow: 0px 2px 4px rgba(0,0,0,.5);">Total = ' + total + '</div>');
            		return;
            	}
            }

            Crafty.e("2D, DOM, Text, Score")
            // .attr({x: 0, y: 0, w: Crafty.viewport.width, h: Crafty.viewport.height / 2})
            .attr({
                x: 0,
                y: 20,
                w: Crafty.viewport.width
            }).css({
                "line-height": "100%",
                "color": "#222",
                "text-align": "center",
                'textShadow': '0px 2px 4px rgba(0,0,0,.5)'
            }).textFont({
            	"family": "Sniglet",
            	"size": "45px"
            }).bind("EnterFrame", function (e) {
                this.text("Height = " + s);

                // Crafty.audio.play('click', 1, 0.1);
                if(s >= score) {
                    s = 0;
                    this.unbind("EnterFrame");
                    setTimeout(function () {
                        Crafty.e("2D, DOM, HTML").attr({
                            x: 0,
                            y: 84,
                            w: Crafty.viewport.width
                        }).bind("EnterFrame", starCounter);
                    }, 250);
                }
                s += ~~ (s + (score - s) / score);
                s = Math.min(s, score);
            });

            var $tbl = $('<table><tr style="border-bottom: 2px solid black"><th>Name</th><th>Score</th></tr>');
            for(var i=0; i<10; i++) {
                // var $row = ('<tr><td>Name</td><td>' + (score + stars * 10) + '</td></tr>');
                var $row = ('<tr><td>Name</td><td>Score</td></tr>');
                $tbl.append($row);
            }
            Crafty.e("HTML, ScoreBoard")
            .attr({x:20, y:300, w:Crafty.viewport.width - 40})
            .css({
                'color': '#000',
                'border': '2px solid #000',
                'borderRadius': '8px'
                // 'boxShadow': '0px 8px 8px rgba(0,0,0,.2)'
            })
            .append('<table id="scoreboard" cellspacing="0">' + $tbl.html() + '</table>');
            //console.log([$tbl, $tbl.html()]);

            var _scene = this;
            setTimeout(function () {

                var txt = Crafty.e("2D, DOM, Text, Delay").attr({
                    x: 4,
                    y: Crafty.viewport.height - 40,
                    w: Crafty.viewport.width,
                    alpha: 0
                }).css({
                    "color": "#888",
                    "text-align": "center"
                }).textFont({
                	"family": "Sniglet",
                	"size": "22px"
                }).text('Press any key to Restart')
                  .bind("EnterFrame", function (e) {
                    var f = e.frame % 100;
                    this.alpha = ~~ (f < 50);
                });
            	
            	_scene.bind("KeyDown", function () {
            		this.unbind("KeyDown");
            		initLevel();
            		Crafty.scene("main");
            	});
            	
            }, 500);
            
        });
        
        function onHitCake(e) {
            var entity = e[0].obj,
                bgovr = Crafty("BackgroundOverlay");

            bgovr.color("#ffff00").delay(function () {
                this.color(BG_COLOR);
            }, 150);

            entity._origin.x = 24;
            entity._origin.y = 42;
            entity.z = 999;


            if(SFX) Crafty.audio.play('cake', 1, 0.5);

            entity.removeComponent("Pickup");
            entity.removeComponent("Cake", true);
            entity.destroy();
            
            Crafty("Platform").each(function (i) {
                var p = this;
                var width = 125;
                var nx = p._x - ((width - p._w)/2);
                p.attr({
                	"w": width,
                	"x": nx
                });
                if (p.moveCap) {
                	p.moveCap();
                }
            });
            

        }


        function onHitStar(e) {
            var entity = e[0].obj,
                bgovr = Crafty("BackgroundOverlay");

            bgovr.color("#ffff00").delay(function () {
                this.color(BG_COLOR);
            }, 150);

            entity._origin.x = 24;
            entity._origin.y = 42;
            entity.z = 999;


            if(SFX) Crafty.audio.play('star', 1, 0.5);

            entity.removeComponent("Pickup");
            entity.removeComponent("Coffee", true);

            var t0 = Crafty.frame(),
                // x0 = entity.x,
                // y0 = entity.y,
                t = e.frame - t0,
                s = 10;

            /**
             * unitstep
             */
            var u = function (t) {
                    // return t < 0 ? 0 : 1;
                    return ~~ (t > 0);
                };
            var _frame = Crafty.frame();
            // var _pos = new Crafty.math.Vector2D(entity.x, entity.y);

            function updateStar(e) {
                var Vector2D = Crafty.math.Vector2D,
                    dest = new Vector2D(Crafty.viewport.x + 150, -Crafty.viewport.y - 16),
                    src = new Vector2D(this.x, this.y),
                    d = src.distance(dest),
                    v = dest.subtract(src);

                if(d <= 10) {
                    this.unbind("EnterFrame");
                    stars++;
                    Crafty("Stars").replace('<div id="stars" style="position: relative; top: 0px;"><img src="assets/images/coffee.png"/><span style="font: 36px Sniglet; margin-top: -12px; text-shadow: 0px 2px 4px rgba(0,0,0,.5)">&nbsp;x&nbsp;' + stars + '</span></div>');
                    $("#stars").animate({
                        'top': '+=10px',
                        'zoom': 1.02
                    }, 75).delay(50).animate({
                        'top': '-=10px',
                        'zoom': 1
                    }, 75);
                    $("#stars>span:first").animate({
                        'top': '+=10px',
                        'zoom': 1.05
                    }, 75).delay(75).animate({
                        'top': '-=12px',
                        'zoom': 1
                    }, 100);

                    this.destroy();

                }

                v.normalize();
                v.scale(s, s);

                // apply some kind of back easing...
                var df = e.frame - _frame;
                var k = u(df - 25);
                // var r = src.distance(_pos);
                // var q = Math.max(0, Math.min(100, r)) / 100;
                // v.y = k * v.y + 100 * Math.exp(-6*q) * (1 - k);
                // v.y = k * v.y + -0.5 * v.y * q * (1-k);
                v.y = k * v.y - 0.1 * v.y * (1 - k);

                var f = e.frame % 8;
                // this.alpha = ~~ (f < 5);
                this.alpha = 0.5;//1 - u(f - 5);

                this.x += v.x;
                this.y += v.y;
            }
            entity.bind("EnterFrame", updateStar);
        }

        function onHitFork(a) {
            var e = a[0].obj,
                octocat = Crafty("Player"),
                bg = Crafty("Background"),
                bgovr = Crafty("BackgroundOverlay");
            
            e.removeComponent("Pickup");
            e.removeComponent("Briefcase");
            e.destroy();

            forks++;

            if(SFX) Crafty.audio.play("fork", 1, 0.5);

            this.disableControls();

            Crafty.e("2D, DOM, Portal, SpriteAnimation").reel("portal", 500, 0, 0, 10).animate("portal", 1).attr({
                x: this.x - 48,
                y: this.y - 48,
                w: 192,
                h: 192,
                z: 500
            });

            function colorBg() {
                bgovr.color("#fff");
            }

            function revertBg() {
                bgovr.color(BG_COLOR);
            }

            function blinkRepeatedly() {
                var i = 0;
                for(; i<15; i+=2) {
                    setTimeout(colorBg, 50 * i);
                    setTimeout(revertBg, 50 * (i+1));
                }
            }
            blinkRepeatedly();

            octocat.tween({
                alpha: 0
            }, 20);

            octocat.delay(function () {
                blinkRepeatedly();

                octocat.tween({
                    alpha: 1
                }, 20);

                var p = level_data[n - 1];
                this.x = p.x;
                this.y = p.y - octocat.h / 2;
                this._speed.y = Math.min(-1, -this._speed.y);

                octocat.enableControls();
                // octocat.unbind("EnterFrame", f);
                Crafty.e("2D, DOM, Portal, SpriteAnimation").reel("portal", 500, 0, 0, 10).animate("portal", 1).attr({
                    x: this.x - 48,
                    y: this.y - 48,
                    w: 192,
                    h: 192
                }).bind("AnimationEnd", function () {
                    this.destroy();
                });

            }, 1000);
        }

        function onHitPlatform(e) {

            var c = e[0],
                obj = c.obj,
                octocat = Crafty("Player"),
                bgovr = Crafty("BackgroundOverlay"),
                dy = this.y - this._oldpos.y;

            if(dy <= 0 || obj.alpha !== 1) return;

            // if (-1 === c.normal.y) {
            if(-1 === c.normal.y) {


                Crafty.e("2D, DOM, SmokeJump, SpriteAnimation, Delay").origin('center').attr({
                    x: this.x + 16,
                    y: this.y - 8,
                    w: 64,
                    h: 64
                }).reel("Smoke", 500, 0, 0, 10).animate('Smoke', 1).bind("AnimationEnd", this.destroy);

                var _y = obj.y;
                obj.tween({
                    y: _y + 20
                }, 5).bind("TweenEnd", function (k) {
                    if(k === 'y') obj.tween({
                        y: _y
                    }, 4);
                });

                if(dy > 0) {

                    // this.stopFalling();
                    this.y += c.overlap * -c.normal.y;

                    this._speed.y = obj.has("Major") ? -this.PUSH_HEIGHT : -this.JUMP_HEIGHT;

                    if(c.obj.has("Critical")) {
                    	
                    	if (obj._cpNum === lastCriticalPath + 1) {
                    		criticalPathBonus++;
                    	} else {
                    		criticalPathBonus = 1;
                    	}
                    	bonusText("Critical Path x" + criticalPathBonus + "!", 50);
                    	
                    	lastCriticalPath = obj._cpNum;
                    	
                        if(obj.use) obj.use();
                        if(SFX) Crafty.audio.play("pull", 1, 0.2);

                        bgovr.color("#ff0000").delay(function () {
                            this.color(BG_COLOR);
                        }, 250);
                        
                    } else if(c.obj.has("Major")) {
                        if(obj.use) obj.use();

                        if(SFX) Crafty.audio.play("push", 1, 0.2);

                        bgovr.color("#00ff00").delay(function () {
                            this.color(BG_COLOR);
                        }, 250);
                    } else if(SFX) Crafty.audio.play("jump", 1, 0.1);

                }
            }
        }
        
        function onHitApple(e) {
        	
        	if (!this._enabled) return;
        	
            var c = e[0],
                obj = c.obj;
            
            if (!obj._canHit) return;
            
            obj._canHit = false;
            
            var octocat = Crafty("Player"),
                bgovr = Crafty("BackgroundOverlay");

            var _ox = octocat._x;
            var _ax = obj._x;
            var _ay = obj._y;

            if(SFX) Crafty.audio.play('bonk', 1, 0.5);

            octocat.tween({
            	x: _ox + (150 * obj._dir)
            }, 500);

            obj.tween({
            	x: _ox - (250 * obj._dir),
            	y: _ay + 250
            }, 500).bind("TweenEnd", function (k) {
            	obj._active = false;
            	obj.attr({
            		alpha: 0
            	})
            }, 5);
            
            bgovr.color("#ff000").delay(function () {
                this.color(BG_COLOR);
            }, 250);

        	
        }

        
        function onHitRing(e) {

            if (!this._canHit) return;

            this.useRing();
            
            hoopBonus++;
            
            bonusText("Hoop<br>Bonus!");
            
        	var bgovr = Crafty("BackgroundOverlay");
            bgovr.color("#ff3300").delay(function () {
                this.color(BG_COLOR);
            }, 250);

        	
        }

        function onHitRingSide(e) {

            if (!this._canHit) return;

            this.spinRing();
            
        	var bgovr = Crafty("BackgroundOverlay");
            bgovr.color("#cc00cc").delay(function () {
                this.color(BG_COLOR);
            }, 250);
        	
        }

        
        function bonusText(txt, size) {
        	
        	var fSize = (size || 72) + "px";
        	
        		Crafty.e("2D, DOM, Text, Delay, BonusText").css({
        			"text-align": "center",
        			"color": "#fff",
        			'textShadow': '0px 2px 8px rgba(0,0,0,.9), -1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000'
        		}).attr({
        			x: 0,
        			y: -Crafty.viewport.y + (Crafty.viewport.height / 4),
        			w: Crafty.viewport.width,
        			z: 9999
        		}).textFont({
        			"family": "Sniglet",
        			"size": fSize
        		})
        		.delay(function() {
        			this.destroy();
        		}, 750)
        		.text(txt);

        }
        
        function initState() {
            Crafty.background("none");
            Crafty.viewport.y = 0;
            score = 0;
            stars = 0;
            criticalPathCounter = 0;
            lastCriticalPath = -2;
            criticalPathBonus = 1;
            hoopBonus = 0;
            n = 10;
            isDead = false;
        }

        Crafty.scene("main", function mainScene() {

        	initState();

            Crafty.background("#FFFFFF");
            
            var bg = Crafty.e("2D, Canvas, Image, Background").attr({
                x: 0,
                y: 0,
                z: -4,
                w: 490,
                h: Crafty.viewport.height
            }).image("assets/images/gantt_bg.png");
            
            var bg2 = Crafty.e("2D, Canvas, Image").attr({
                x: 490,
                y: 0,
                z: -3,
                w: 490,
                h: Crafty.viewport.height
            }).image("assets/images/gantt_bg.png");

            var bgovr = Crafty.e("2D, Canvas, BackgroundOverlay, Color, Delay").attr({
                x: 0,
                y: 0,
                z: -1,
                w: Crafty.viewport.width,
                h: Crafty.viewport.height,
                alpha: OVERLAY_ALPHA
            }).color(BG_COLOR);

            var octocat = Crafty.e("2D, DOM, Player, Octocat, SpriteAnimation, Physics, PlayerControls, Collision, Tween, Delay").origin('center').setName("octocat").attr({
                x: 160,
                y: Crafty.canvas._canvas.height / 2 - 48,
                z: 999
            }).reel("walk", 500, 0, 0, 3).animate('walk', -1)
            .collision(new Crafty.circle(48, 48, 32))
            .onHit("Coffee", onHitStar)
            .onHit("Cake", onHitCake)
            .onHit("Apple", onHitApple)
            .onHit("Briefcase", onHitFork)
            .onHit("Platform", onHitPlatform);

            
            
            
            var theApple = null;
            

            
            function scrollViewport(e) {

            	Crafty.viewport.y += SCROLL_SPEED;
                bg.y = -Crafty.viewport.y;
                bg2.y = -Crafty.viewport.y;
                bg.x = bg._x - SCROLL_SPEED;
                bg2.x = bg2._x - SCROLL_SPEED;
                if (bg._x <= -490) {
                	bg.x = 490;
                }
                if (bg2._x <= -490) {
                	bg2.x = 490;
                }
                bgovr.y = -Crafty.viewport.y; 

            }
            Crafty.bind("EnterFrame", scrollViewport);
            
            

            Crafty.bind("Pause", function onPause() {
                // Crafty.audio.mute();
                Crafty("BackgroundOverlay").color("#000000");
                Crafty("BackgroundOverlay").alpha = 0.5;
                Crafty("PauseText").destroy();
                Crafty.e("2D, DOM, Text, PauseText").css({
                	"text-align": "center",
                    "color": "#fff",
                    'textShadow': '0px 2px 8px rgba(0,0,0,.9), -1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000'
                }).attr({
                	x: 0,
                    y: Crafty.viewport.height / 2 - Crafty.viewport.y - 64,
                    w: Crafty.viewport.width,
                    z: 9999
                }).textFont({
                	"family": "Sniglet",
                	"size": "96px"
                }).text("Paused");
                Crafty.trigger("RenderScene");
            });
            Crafty.bind("Unpause", function onUnpause() {
                // Crafty.audio.unmute();
                Crafty("BackgroundOverlay").color(BG_COLOR);
                Crafty("BackgroundOverlay").alpha = 0.2;
                Crafty("PauseText").destroy();
            });

            (function (vp) {
                var _pvy = Crafty.viewport.y,
                    _dvy = 0;

                function recyclePlatforms(e) {
                    _dvy += vp.y - _pvy;
                    _pvy = vp.y;
                    if(_dvy > 20) {
                        // if(_dvy > 20 && e.frame % 25 === 0) {
                        Crafty("Platform").each(function (i) {
                            _dvy = 0;
                            var p = this;
                            if(vp.y + this.y > vp.height) {
                                // this.y = -Crafty.viewport.y - this.y - i * 100 * (++j);
                                var d = level_data[n++];
                                
                                this.unbind("TweenEnd");

                                if(this._children) {
                                    for(var j = 0; j < this._children.length; j++) {
                                        if(this._children[j].destroy) {
                                            this._children[j].destroy();
                                        } else if(this._children[j] instanceof Crafty.polygon) delete this._children[j];
                                    }
                                    this._children = [];
                                }

                                this.removeComponent("Critical");
                                this.removeComponent("Major");
                                this.removeComponent("Push");
                                this.removeComponent("Pull");

                                this.color(TASK_COLOR);
                                this.alpha = 1;
                                this.attr(d);
                                this.collision();

                                var r = ~~ (10 * (1 + Math.random()));
                                if(0 === n % r) {
                                	
                                    this.addComponent("Critical");
                                    this._cpNum = criticalPathCounter++;
                                    
                                } else if(!this.has("Critical") && 0 === n % (r + 1)) {
                                	
                                    this.addComponent("Major");
                                    
                                } else if(0 === n % (r + 2)) {
                                	
                                    Crafty.e("2D, Canvas, Pickup, Briefcase, Image, Tween, Delay").attr({
                                        x: this._x + (this._w - 48) / 2,
                                        y: this._y - 64
                                    })
                                    .image("assets/images/briefcase.png");
                                    
                                } else if(0 === n % 2) {
                                	
                                    Crafty.e("2D, Canvas, Pickup, Coffee, Image, Tween, Delay").attr({
                                        x: this._x + (this._w - 48) / 2,
                                        y: this._y - 64
                                    })
                                    .image("assets/images/coffee.png");
                                    
                                } else if(0 === n % 9) {
                                	
                                    Crafty.e("2D, Canvas, Pickup, Cake, Image").attr({
                                        x: this._x + (this._w - 48) / 2,
                                        y: this._y - 64
                                    })
                                    .image("assets/images/cake.png");
                                    
                                } else if(n > 50 && 0 === n % 7) {
                                	
                                	Crafty.e("2D, Collision, Tween, Ring").attr({
                        				w: 240,
                        				h: 70
                        			}).origin(120,35);
                                    
                                } else if (n > 80 && 0 === n % 5) {
                                	
                                	if (theApple === null) {
                                		theApple = Crafty.e("2D, DOM, Image, Tween, Apple")
                                		.image("assets/images/apple.png");
                                	} else {
                                		if (!theApple._active) {
                                			theApple.reset();
                                		}
                                	}
                                	
                                }
                                this.trigger("Recycled");
                            }
                        });
                    }
                }
                Crafty.bind("EnterFrame", recyclePlatforms);
            })(Crafty.viewport);

            (function (vp) {
                function updateOctocat(e) {
                    var y = this.y;
                    isDead = this._enabled && (vp.y + y > vp.height);
                    if(isDead) {
                        Crafty.audio.play('dead', 1, 0.2);
                        Crafty.unbind("EnterFrame", scrollViewport);
                        //Crafty.unbind("EnterFrame", throwApples);
                        this.unbind('EnterFrame', updateOctocat);
                        setTimeout(function () {
                            Crafty.scene('dead');
                        }, 750);
                        return;
                    }

                    if(this._oldpos.y > y) {
                        this._oldpos.y = y;
                        if(this._enabled) vp.y = Math.max(vp.y, vp.height / 2 - y - 200);
                    }
                }
                octocat.bind("EnterFrame", updateOctocat);
            })(Crafty.viewport);

            // Create the Platform pool, these entities will be recycled throughout the level
            (function initPlatformPool() {
                var i, css = {
                    'border': '2px solid rgba(0, 0, 0, .2)',
                    'borderRadius': '8px',
                    'boxShadow': '0px 8px 8px rgba(0,0,0,.2)'
                };
                for(i in level_data.slice(1, 11)) {
                    Crafty.e("2D, DOM, Color, Platform, Collision, Tween, Delay").attr(level_data[i])
                    .color(TASK_COLOR)
                    .collision().css(css);
                }
            })();



            function _updateScore() {
                score = Math.max(score, ~~ ((Crafty.viewport.height - Crafty("Player").y) * 0.1 - 1));
                return score;
            }

            function updateScore() {
                this.y = -Crafty.viewport.y;
                this.text(_updateScore);
            }
            Crafty.e("2D, DOM, Text, Score").attr({
                x: 10,
                z: 9999
            }).css({
                "color": "#fff",
                "text-align": "left",
                'textShadow': '0px 2px 4px rgba(0,0,0,.5)'
            }).textFont({
            	"family": "Sniglet",
            	"size": "48px"
            }).bind("EnterFrame", updateScore);


            (function () {
                var _stars = -1;

                function updateStars(e) {
                    this.x = Crafty.viewport.width / 2 - 48;
                    this.y = -Crafty.viewport.y;
                }
                Crafty.e("HTML, Stars, Tween, Delay").attr({
                    x: this.x + 34,
                    y: this.y - 64,
                    w: 200,
                    z: 9999
                }).bind("EnterFrame", updateStars);
            })();


            function toggleSFX(e) {
                if(e.mouseButton !== Crafty.mouseButtons.LEFT) return;
                SFX = !SFX;
                Crafty("SFX").image('assets/images/' + (SFX ? 'speaker.png' : 'mute.png'));
            }

            function updateSpeaker() {
                this.x = Crafty.viewport.width - 64;
                this.y = -Crafty.viewport.y + 10;

            }
            Crafty.e("2D, DOM, SFX, Image, Mouse").attr({
                x: Crafty.viewport.width - 64,
                y: -Crafty.viewport.y + 10,
                w: 48,
                h: 48,
                z: 9999
            }).css('cursor', 'pointer').image("assets/images/speaker.png").bind("EnterFrame", updateSpeaker)
            // .areaMap([0,0], [50,0], [50,50], [0,50])
            .bind('MouseOver', function () {
                this.alpha = 0.8;
                this.bind('MouseDown', toggleSFX);
            }).bind('MouseOut', function () {
                this.alpha = 1;
                this.unbind('MouseDown', toggleSFX);
            });
        });

        Crafty.scene("loading", function () {
        	
            var imgPath = function (x) {
                    return "assets/images/" + x;
                };
            var sndPath = function (x) {
                    return "assets/sounds/" + x;
                };

            Crafty.background("#fff");
            var images = [];
            images = images.concat("title.png", "gantt_bg.png", "business_frog.png", "portal.png", 
            		"cake.png", "apple.png", "briefcase.png", "coffee.png", "smoke_jump.png",
            		"speaker.png", "mute.png", "black_end_cap.png", "red_end_cap.png", "ring_back.png",
            		"ring_front.png");

            var audio = {
                "jump":  ["jump.mp3", "jump.ogg", "jump.wav"].map(sndPath),
                "push":  ["push.mp3", "push.ogg", "push.wav"].map(sndPath),
                "pull":  ["pull.mp3", "pull.ogg", "pull.wav"].map(sndPath),
                "fork":  ["fork.mp3", "fork.ogg", "fork.wav"].map(sndPath),
                "star":  ["star.mp3", "star.ogg", "star.wav"].map(sndPath),
                "cake":  ["cake.mp3", "cake.ogg", "cake.wav"].map(sndPath),
                "bonk":  ["bonk.mp3", "bonk.ogg", "bonk.wav"].map(sndPath),
                "dead":  ["dead.mp3", "dead.ogg", "dead.wav"].map(sndPath),
                "spin":  ["spin.mp3", "spin.ogg", "spin.wav"].map(sndPath),
                "hoop":  ["hoop.mp3", "hoop.ogg", "hoop.wav"].map(sndPath),
                "click": ["click.mp3", "click.ogg", "click.wav"].map(sndPath)
            };
            
            var assetsObj = {
            	"audio": audio,
            	"images": images.map(imgPath) 
            }
            
            Crafty.load(assetsObj, function onLoad() {
            	
                $("#loader").remove();
                $("#cr-stage").show();

                Crafty.sprite(96, "assets/images/business_frog.png", {
                    Octocat: [0, 0]
                });

                Crafty.sprite(64, "assets/images/smoke_jump.png", {
                    SmokeJump: [0, 0]
                });

                Crafty.sprite(192, "assets/images/portal.png", {
                    Portal: [0, 0]
                });

                Crafty.scene("intro");
            });
            
        });

        Crafty.scene("intro", function initIntro() {
            Crafty.background("#fff");

            var txt = Crafty.e("2D, DOM, Text, Delay").attr({
                x: 4,
                y: Crafty.viewport.height - 40,
                w: Crafty.viewport.width,
                alpha: 0
            }).css({
                "color": "#888",
                "text-align": "center"
            }).textFont({
            	"family": "Sniglet",
            	"size": "22px"
            });
            
            txt.bind("EnterFrame", function (e) {
                var f = e.frame % 100;
                this.alpha = ~~ (f < 50);
            });
            Crafty.e('Keyboard').bind('KeyDown', function (e) {
                if(e.keyCode !== Crafty.keys.ESC) return;
                this.destroy();
                Crafty.scene("main");
            });


            Crafty.e("2D, Canvas, Image, Tween, Keyboard").attr({
                alpha: 0
            }).image('assets/images/title.png').tween({
                alpha: 1
            }, 1000).bind("TweenEnd", function () {
                txt.text('Press any key to start the game').css('color', '#fff');
                this.bind("KeyDown", function () {
                    Crafty.scene("main");
                });
            });
        
            
        });

        Crafty.scene("loading");
    });
})(jQuery, Crafty);