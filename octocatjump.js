/**
 * Octocat Jump
 * A Github Game Off 2012 Entry
 * @author Omer Goshen <gershon@goosemoose.com>
 */
(function octocatJump($, Crafty) {
    $(document).ready(function documentReady() {
        var STAGE_WIDTH = 400,
            STAGE_HEIGHT = 640,
            SCROLL_SPEED = 1,
            GRAVITY = 1,
            SFX = true,
            level_data = [],
            score = 0,
            stars = 0,
            forks = 0,
            n = 10,
            isDead = false;

        Crafty.init(STAGE_WIDTH, STAGE_HEIGHT);
        Crafty.canvas.init();
        // Crafty.viewport.init(Crafty.canvas._canvas.width, Crafty.canvas._canvas.height);
        Crafty.viewport.init(STAGE_WIDTH, STAGE_HEIGHT);
        Crafty.settings.modify('autoPause', true);

        function initLevel() {
            var i = 0;
            level_data = [{
                x: Crafty.viewport.width / 2 - 50,
                y: Crafty.viewport.height - 50,
                w: 100,
                h: 20
            }];

            for (i = 0; i < 10000; i++) {
                level_data.push({
                    x: ~~ (Math.random() * (Crafty.viewport.width - 100)),
                    y: -Crafty.viewport.y + Crafty.viewport.height - i * 100,
                    w: 50 + 50 * Math.random(),
                    h: 20,
                    num: i
                });
            }
        }
        initLevel();


        /**
         * Octicons font component
         * @see https://github.com/styleguide/css/7.0
         */
        Crafty.c('Octicons', {
            init: function() {
                this.requires('2D, DOM, Text');
                this.css({
                    'font-family': 'Octicons',
                    'font-size': '48px',
                    'font-weight': 'normal',
                    'textShadow': '0px 2px 4px rgba(0,0,0,.5)'
                    // 'textShadow': '0px 0px 8px rgba(0,0,0,.5), -1px -1px 0 #444,1px -1px 0 #444,-1px 1px 0 #444,1px 1px 0 #444'
                    // 'textShadow': '0px 0px 8px rgba(0,0,0,.5), -1px -1px 0 #fc0,1px -1px 0 #fc0,-1px 1px 0 #fc0,1px 1px 0 #fc0'
                });
                // .text("&#xF220");
            }
        });

        Crafty.c('Push', {
            _label: null,
            init: function() {
                this.color('#4F4');
                this._label = Crafty.e('2D, DOM, Text').attr({
                    x: this.x,
                    y: this.y,
                    w: this.w
                }).textColor('#ffffff').text('Push').css({
                    'font': '18px Chewy, Arial',
                    'text-align': 'center',
                    // 'textShadow': '0px 1px 2px #000'
                    'textShadow': '0px 1px 2px rgba(0,0,0,.5), -1px -1px 0 #484,1px -1px 0 #484,-1px 1px 0 #484,1px 1px 0 #484'
                });
                this.attach(this._label);
            },

            use: function() {
                // this.removeComponent("Push", false);
                this._label.destroy();
                this.tween({
                    alpha: 0
                }, 25).bind('TweenEnd', function(k) {
                    if ('alpha' !== k) {
                        return;
                    }
                    this.color('#888');
                    // this.removeComponent("Push", false);
                    this.removeComponent('Push');
                });
                return this;
            }
        });

        Crafty.c('Pull', {
            _label: null,
            init: function() {
                this.color('#F44');
                this._label = Crafty.e('2D, DOM, Text').attr({
                    x: this.x,
                    y: this.y,
                    w: this.w
                }).textColor('#ffffff').text('Pull').css({
                    'font': '18px Chewy, Arial',
                    'text-align': 'center',
                    // 'textShadow': '0px 1px 2px #000'
                    'textShadow': '0px 1px 2px rgba(0,0,0,.5), -1px -1px 0 #844,1px -1px 0 #844,-1px 1px 0 #844,1px 1px 0 #844'
                });
                this.attach(this._label);
            },

            use: function() {
                // this.removeComponent("Pull", false);
                this._label.destroy();

                this.tween({
                    alpha: 0
                }, 25).bind('TweenEnd', function(k) {
                    if ('alpha' !== k) {
                        return;
                    }
                    this.color('#888');
                    // this.removeComponent("Pull", false);
                    this.removeComponent('Pull');
                });
                return this;
            }
        });

        Crafty.c('PlayerControls', {
            _accel: new Crafty.math.Vector2D(),
            _speed: new Crafty.math.Vector2D(),
            _oldpos: new Crafty.math.Vector2D(),
            _enabled: true,
            ACCEL: 2,
            MAX_SPEED: 5,
            JUMP_HEIGHT: 22,
            PUSH_HEIGHT: 32,

            init: function() {
                this.requires('2D, Keyboard');

                this._accel = new Crafty.math.Vector2D();
                this._speed = new Crafty.math.Vector2D();
                this._oldpos = new Crafty.math.Vector2D();

                this.bind('KeyDown', function(e) {
                    switch (e.keyCode) {
                    case Crafty.keys.SPACE:
                        var clone = Crafty('OctoClone');
                        var p = this.pos();
                        this.x = clone.x;
                        this.y = clone.y;
                        clone.x = p._x;
                        clone.y = p._y;
                        break;
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

                this.bind('KeyUp', function(e) {
                    switch (e.keyCode) {
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

                this.bind('EnterFrame', this._enterframe);
            },

            _enterframe: function() {
                if (!this._enabled) return;

                if (0 === this._accel.x) {
                    // this._speed.x *= 1 - Math.exp(-2);
                    this._speed.x *= 0.8646647167633873;
                }

                this._speed.x += this._accel.x;
                this._speed.y += this._accel.y + GRAVITY;

                this._speed.x = Crafty.math.clamp(this._speed.x, -this.MAX_SPEED, this.MAX_SPEED);

                this._oldpos.x = this.x;
                this._oldpos.y = this.y;

                // var dr = {
                //     x: this.x - this._speed.x,
                //     y: this.y - this._speed.y
                // };
                // this.trigger('Moved', dr);
                if (0 !== this._speed.x) {
                    var _x = this.x;
                    this.x += this._speed.x;
                    if (this.x > Crafty.viewport.width) this.x = -this.w;
                    if (this.x < -this.w) this.x += Crafty.viewport.width + this.w;
                    // this.x = ~~(this.x);
                    this.trigger('Moved', {
                        // x: this.x - this._speed.x,
                        x: _x,
                        y: this.y
                    });
                }

                if (0 !== this._speed.y) {
                    this.y += this._speed.y;
                    this.trigger('Moved', {
                        x: this.x,
                        y: this.y - this._speed.y
                    });
                }


            },

            enableControls: function() {
                this._enabled = true;
                return this;
            },
            disableControls: function() {
                this._enabled = false;
                return this;
            }
        });

        Crafty.scene('dead', function initDead() {
            // Crafty.background("#fff");
            Crafty.viewport.y = 0;
            var s = 0,
                total = 0;
            Crafty.background("url('assets/images/restart.gif') no-repeat center center #fff");

            function starCounter(e) {
                // if(0 === e.frame % 2)
                {
                    // Crafty.audio.play('star', 1, 0.5);
                    this.replace('<div style="text-align: center"><span style="font: 48px Octicons; color:#FF8; text-shadow: 0px 2px 8px rgba(0,0,0,.5), -1px -1px 0 #fc0,1px -1px 0 #fc0,-1px 1px 0 #fc0,1px 1px 0 #fc0">&#xF22A</span><span style="color: #222; font: 36px Chewy; margin-top: -12px; text-shadow: 0px 2px 4px rgba(0,0,0,.5)"><small>X</small> ' + s + ' = ' + (s * 10) + '</span></div>');

                    if (++s > stars) {
                        this.unbind('EnterFrame');

                        total = (s - 1) * 10 + score;
                        Crafty.e('2D, DOM, HTML').attr({
                            x: 0,
                            y: 144,
                            w: Crafty.viewport.width
                        }).replace('<div style="text-align: center; font: 48px Chewy, Impact; color: #222; text-shadow: 0px 2px 4px rgba(0,0,0,.5);">Total = ' + total + '</div>');
                        return;
                    }
                }
            }

            Crafty.e('2D, DOM, Text, Score')
            // .attr({x: 0, y: 0, w: Crafty.viewport.width, h: Crafty.viewport.height / 2})
            .attr({
                x: 0,
                y: 20,
                w: Crafty.viewport.width
            }).css({
                // "width": Crafty.viewport.width + "px",
                'font': '48px Chewy, Impact',
                'line-height': '100%',
                'color': '#222',
                'text-align': 'center',
                'textShadow': '0px 2px 4px rgba(0,0,0,.5)'
            })
            // .text("Your Score:\n" + score);
            .bind('EnterFrame', function(e) {
                this.text('Height = ' + s);

                // Crafty.audio.play('click', 1, 0.1);
                if (s >= score) {
                    s = 0;
                    this.unbind('EnterFrame');
                    setTimeout(function() {
                        Crafty.e('2D, DOM, HTML').attr({
                            x: 0,
                            y: 64,
                            w: Crafty.viewport.width
                        }).bind('EnterFrame', starCounter);
                    }, 250);
                }
                s += ~~ (s + (score - s) / score);
                s = Math.min(s, score);
            });

            var $tbl = $('<table><tr style="border-bottom: 2px solid black"><th>Name</th><th>Score</th></tr>');
            for (var i = 0; i < 10; i++) {
                // var $row = ('<tr><td>Name</td><td>' + (score + stars * 10) + '</td></tr>');
                var $row = ('<tr><td>Name</td><td>Score</td></tr>');
                $tbl.append($row);
            }

            // Crafty.e("HTML, ScoreBoard")
            // .attr({x:20, y:250, w:Crafty.viewport.width - 40})
            // .css({
            //     'color': '#000',
            //     'border': '2px solid #000',
            //     'borderRadius': '8px'
            //     // 'boxShadow': '0px 8px 8px rgba(0,0,0,.2)'
            // })
            // .append('<table id="scoreboard" cellspacing="0">' + $tbl.html() + '</table>');
            // // setTimeout(function() {
            // //     Crafty.scene("main");
            // // }, 3000);
        });

        function onHitStar(e) {
            var entity = e[0].obj,
                bgovr = Crafty('BackgroundOverlay');
            // e.removeComponent("Pickup", false);
            bgovr.color('#ffff00').delay(function() {
                this.color('#006064');
            }, 150);

            entity._origin.x = 24;
            entity._origin.y = 42;
            entity.z = 999;


            if (SFX) Crafty.audio.play('star', 1, 0.5);

            entity.removeComponent('Pickup');
            entity.removeComponent('Star', true);
            // entity.removeComponent("Star", false);
            var t0 = Crafty.frame(),
                // x0 = entity.x,
                // y0 = entity.y,
                t = e.frame - t0,
                s = 10;

            /**
             * unitstep
             */
            var u = function(t) {
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

                if (d <= 10) {
                    this.unbind('EnterFrame');
                    stars++;
                    Crafty('Stars').replace('<div id="stars" style="position: relative; top: 0px;"><span id="star" style="font: 48px Octicons; color:#FF8; text-shadow: 0px 2px 8px #fc0, -1px -1px 0 #fc0,1px -1px 0 rgba(0,0,0,0.2),-1px 1px 0 rgba(0,0,0,0.2),1px 1px 0 rgba(0,0,0,0.2);">&#xF22A</span><span style="font: 36px Chewy; margin-top: -12px; text-shadow: 0px 2px 4px rgba(0,0,0,.5)"><small>X</small> ' + stars + '</span></div>');
                    $('#stars').animate({
                        'top': '+=10px',
                        'zoom': 1.02
                    }, 75).delay(50).animate({
                        'top': '-=10px',
                        'zoom': 1
                    }, 75);
                    $('#stars>span:first').animate({
                        'top': '+=10px',
                        'zoom': 1.05
                    }, 75).delay(75).animate({
                        'top': '-=12px',
                        'zoom': 1
                    }, 100);

                    this.destroy();

                    // this.tween({
                    //     // rotation: 0,
                    //     alpha: 0
                    // }, 25).bind("TweenEnd", function (k) {
                    //     if(k === 'alpha') {
                    //         // $("#stars").animate({zoom: 1.5}, 150).delay(50).animate({zoom: 1}, 150);
                    //         this.destroy();
                    //     }
                    // });
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

                var f = e.frame % 10;
                // this.alpha = ~~ (f < 5);
                this.alpha = 1 - u(f - 5);

                this.x += v.x;
                this.y += v.y;
            }
            entity.bind('EnterFrame', updateStar);
        }

        function onHitFork(a) {
            var e = a[0].obj,
                octocat = Crafty('Player'),
                bg = Crafty('Background'),
                bgovr = Crafty('BackgroundOverlay');
            // e.removeComponent("Pickup", false);
            e.removeComponent('Pickup');
            e.removeComponent('Fork');
            e.destroy();

            forks++;

            if (SFX) Crafty.audio.play('fork', 1, 0.5);

            this.disableControls();

            Crafty.e('2D, DOM, Portal, SpriteAnimation').animate('portal', 0, 0, 10).animate('portal', 5, 0).attr({
                x: this.x - 48,
                y: this.y - 48,
                w: 192,
                h: 192
            });

            // octocat.delay(octocat.enableControls, 500);

            function colorBg() {
                bgovr.color('#fff');
            }

            function revertBg() {
                bgovr.color('#006064');
            }

            function blinkRepeatedly() {
                var i = 0;
                for (; i < 15; i += 2) {
                    setTimeout(colorBg, 50 * i);
                    setTimeout(revertBg, 50 * (i + 1));
                }
            }
            blinkRepeatedly();

            octocat.tween({
                alpha: 0
            }, 20);

            octocat.delay(function() {
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
                Crafty.e('2D, DOM, Portal, SpriteAnimation').animate('portal', 0, 0, 10).animate('portal', 5, 0).attr({
                    x: this.x - 48,
                    y: this.y - 48,
                    w: 192,
                    h: 192
                }).bind('AnimationEnd', function() {
                    this.destroy();
                    // Crafty.e("2D, DOM, Text, PauseText").css({
                    //     // "width": Crafty.viewport.width + "px",
                    //     "font": "64px Chewy",
                    //     "color": "#fff",
                    //     "text-align": "center",
                    //     'textShadow': '0px 2px 8px rgba(0,0,0,.9), -1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000'
                    // }).attr({
                    //     x: Math.max(0, Math.min(Crafty.viewport.x, this.x)),
                    //     y: this.y,
                    //     z: 9999
                    // }).text("Forked");
                });

            }, 1000);
        }

        function onHitPlatform(e) {

            var c = e[0],
                obj = c.obj,
                octocat = Crafty('Player'),
                bgovr = Crafty('BackgroundOverlay'),
                dy = this.y - this._oldpos.y;

            if (dy <= 0 || obj.alpha !== 1) return;

            // if (-1 === c.normal.y) {
            if (-1 === c.normal.y) {


                Crafty.e('2D, DOM, SmokeJump, SpriteAnimation, Delay').origin('center').attr({
                    x: this.x + 16,
                    y: this.y - 8,
                    w: 64,
                    h: 64
                }).animate('Smoke', 0, 0, 10).animate('Smoke', 25, 0).bind('AnimationEnd', this.destroy);

                var _y = obj.y;
                obj.tween({
                    y: _y + 20
                }, 5).bind('TweenEnd', function(k) {
                    if (k === 'y') obj.tween({
                        y: _y
                    }, 4);
                });

                if (dy > 0) {

                    // this.stopFalling();
                    this.y += c.overlap * -c.normal.y;

                    this._speed.y = obj.has('Push') ? -this.PUSH_HEIGHT : -this.JUMP_HEIGHT;

                    if (c.obj.has('Pull')) {
                        if (obj.use) obj.use();
                        // c.obj.bind("TweenEnd", function(){
                        //     c.obj.use();
                        // });
                        if (SFX) Crafty.audio.play('pull', 1, 0.2);

                        bgovr.color('#ff0000').delay(function() {
                            this.color('#006064');
                        }, 250);
                    } else if (c.obj.has('Push')) {
                        if (obj.use) obj.use();

                        if (SFX) Crafty.audio.play('push', 1, 0.2);

                        bgovr.color('#00ff00').delay(function() {
                            this.color('#006064');
                        }, 250);
                    } else if (SFX) Crafty.audio.play('jump', 1, 0.1);

                }
            }
        }

        Crafty.scene('main', function mainScene() {
            function initState() {
                Crafty.background('none');
                Crafty.viewport.y = 0;
                score = 0;
                stars = 0;
                isDead = false;
            }
            initState();

            var bg = Crafty.e('2D, Canvas, Image, Background').attr({
                x: 0,
                y: 0,
                z: -4,
                w: Crafty.viewport.width,
                h: Crafty.viewport.height
            }).image('assets/images/bg.png', 'repeat');
            // }).image(R.BG_PNG, "repeat");
            var bgovr = Crafty.e('2D, DOM, BackgroundOverlay, Color, Delay').attr({
                x: 0,
                y: 0,
                z: -1,
                w: Crafty.viewport.width,
                h: Crafty.viewport.height,
                alpha: 0.2
            }).color('#006064');

            var clone = Crafty.e('2D, DOM, OctoClone, Octocat, SpriteAnimation, Tween, Delay').origin('center').attr({
                x: 160,
                y: Crafty.canvas._canvas.height / 2 - 48,
                z: 1,
                alpha: 0.5
            }).animate('walk', 0, 0, 3).animate('walk', 5, -1);

            var octocat = Crafty.e('2D, DOM, Player, Octocat, SpriteAnimation, Physics, PlayerControls, Collision, Tween, Delay').origin('center').setName('octocat').attr({
                x: 160,
                y: Crafty.canvas._canvas.height / 2 - 48,
                z: 999
            }).animate('walk', 0, 0, 3).animate('walk', 5, -1)
            // .gravity()
            // .gravityConst(1)
            // .collision(new Crafty.polygon([16, 80], [80, 80], [80, 16], [16, 16]))
            // .collision(new Crafty.polygon([0, 96], [96, 96], [96, 0], [0, 0]))
            .collision(new Crafty.circle(48, 48, 32)).onHit('Star', onHitStar).onHit('Fork', onHitFork).onHit('Platform', onHitPlatform);

            var ol = [{
                x: octocat.x,
                y: octocat.y
            }];

            function updateClone(e) {
                // var ov = new Crafty.math.Vector2D(octocat.x, octocat.y),
                //     oc = new Crafty.math.Vector2D(this.x, this.y),
                //     d = oc.distance(ov);
                // // console.log(d);
                // if(e.frame > 100 && d !== 0 && d < 200) {
                //     // Crafty.scene('dead');
                // }
                var p = ol.pop();
                this.delay(function() {
                    this.x = p.x;
                    this.y = p.y;
                    // }, 750);
                }, 1000);
                ol.push({
                    x: octocat.x,
                    y: octocat.y
                });
            }
            clone.bind('EnterFrame', updateClone);
            // (function (bg, bgovr, viewport) {
            // Crafty.bind("SceneChange", function (e) {
            //     if(e.oldScene === "main") Crafty.unbind("EnterFrame", scrollViewport);
            // });

            function scrollViewport(e) {
                // if(isDead) {
                //     Crafty.unbind("EnterFrame", scrollViewport);
                //     return;
                // }
                Crafty.viewport.y += SCROLL_SPEED;
                bg.y = -Crafty.viewport.y;
                bgovr.y = -Crafty.viewport.y;
            }
            Crafty.bind('EnterFrame', scrollViewport);
            // })(bg, bgovr, Crafty.viewport);
            Crafty.bind('Pause', function onPause() {
                // Crafty.audio.mute();
                if (Crafty('BackgroundOverlay').length) {
                    Crafty('BackgroundOverlay').color('#000000');
                    Crafty('BackgroundOverlay').alpha = 0.5;
                }
                Crafty.stage.elem.style.opacity = 0.5;
                Crafty('PauseText').destroy();
                Crafty.e('2D, DOM, Text, PauseText').css({
                    'width': Crafty.viewport.width + 'px',
                    'font': '96px Chewy, Impact',
                    'color': '#fff',
                    'text-align': 'center',
                    'textShadow': '0px 2px 8px rgba(0,0,0,.9), -1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000'
                }).attr({
                    x: 0,
                    y: Crafty.viewport.height / 2 - Crafty.viewport.y - 64,
                    z: 9999
                }).text('Paused');
                Crafty.DrawManager.draw();
            });
            Crafty.bind('Unpause', function onUnpause() {
                // Crafty.audio.unmute();
                if (Crafty('BackgroundOverlay').length) {
                    Crafty('BackgroundOverlay').color('#006064');
                    Crafty('BackgroundOverlay').alpha = 0.2;
                }
                Crafty.stage.elem.style.opacity = 1;
                Crafty('PauseText').destroy();
                Crafty.DrawManager.draw();
            });

            (function(vp) {
                var _pvy = Crafty.viewport.y,
                    _dvy = 0;

                function recyclePlatforms(e) {
                    _dvy += vp.y - _pvy;
                    _pvy = vp.y;
                    if (_dvy > 20) {
                        // if(_dvy > 20 && e.frame % 25 === 0) {
                        Crafty('Platform').each(function(i) {
                            _dvy = 0;
                            var p = this;
                            if (vp.y + this.y > vp.height) {
                                // this.y = -Crafty.viewport.y - this.y - i * 100 * (++j);
                                var d = level_data[n++];
                                this.unbind('TweenEnd');

                                if (this._children) {
                                    for (var j = 0; j < this._children.length; j++) {
                                        if (this._children[j].destroy) {
                                            this._children[j].destroy();
                                        } else if (this._children[j] instanceof Crafty.polygon) delete this._children[j];
                                    }
                                    this._children = [];
                                }

                                // if(this._label)
                                // this._label.destroy();
                                this.removeComponent('Push');
                                this.removeComponent('Pull');

                                this.color('#888');
                                this.alpha = 1;
                                this.attr(d);
                                this.collision();


                                // this.attr(d);
                                // this.alpha = 1;
                                // this.bind("TweenEnd", function (k) {
                                //     if('y' === k) {
                                //         this.attr(d);
                                //         this.unbind("TweenEnd");
                                //     }
                                //     if('alpha' === k) {
                                //         this.attr(d);
                                //     }
                                //     // this.alpha = 1;
                                //     // this.collision();
                                //     // this.unbind("TweenEnd");
                                // });
                                var r = ~~ (10 * (1 + Math.random()));
                                if (0 === n % r) {
                                    // this.removeComponent("Push", false).addComponent("Push");
                                    // this.removeComponent("Push").addComponent("Push");
                                    this.addComponent('Push');
                                } else if (!this.has('Push') && 0 === n % (r + 1)) {
                                    // this.removeComponent("Pull", false).addComponent("Pull");
                                    // this.removeComponent("Pull").addComponent("Pull");
                                    this.addComponent('Pull');
                                } else if (0 === n % (r + 2)) {
                                    Crafty.e('Octicons, Pickup, Fork, Tween, Delay').attr({
                                        x: this.x + (this.w - 48) / 2,
                                        y: this.y - 64
                                    }).css('textShadow', '0px 0px 8px rgba(0,0,0,.5), -1px -1px 0 #888,1px -1px 0 #888,-1px 1px 0 #888,1px 1px 0 #888').text('&#xF220');
                                } else if (0 === n % 2) {
                                    Crafty.e('Octicons, Pickup, Star, Tween, Delay').attr({
                                        x: this.x + (this.w - 48) / 2,
                                        y: this.y - 64
                                    }).css('textShadow', '0px 0px 8px rgba(0,0,0,.5), -1px -1px 0 #fc0,1px -1px 0 #fc0,-1px 1px 0 #fc0,1px 1px 0 #fc0').css('color', '#FF8').text('&#xF22A'); // star
                                }
                                this.trigger('Recycled');
                            }
                        });
                    }
                }

                Crafty.bind('EnterFrame', recyclePlatforms);
            })(Crafty.viewport);

            (function(vp) {
                function updateOctocat(e) {
                    var y = this.y;
                    // this.animate('walk', 5, - 1);
                    // Crafty.viewport.scroll('y', Crafty.viewport.height/2 - octocat.y);
                    // isDead = Crafty.viewport.y + this.y > Crafty.canvas._canvas.height;
                    isDead = this._enabled && (vp.y + y > vp.height);
                    if (isDead) {
                        // Crafty.scene('dead');
                        Crafty.audio.play('dead', 1, 0.2);
                        Crafty.unbind('EnterFrame', scrollViewport);
                        this.unbind('EnterFrame', updateOctocat);
                        setTimeout(function() {
                            Crafty.scene('dead');
                        }, 750);
                        return;
                    }

                    if (this._oldpos.y > y) {
                        this._oldpos.y = y;
                        if (this._enabled) vp.y = Math.max(vp.y, vp.height / 2 - y - 200);
                    }
                }
                octocat.bind('EnterFrame', updateOctocat);
            })(Crafty.viewport);

            // Create the Platform pool, these entities will be recycled throughout the level
            (function initPlatformPool() {
                var i, css = {
                    'border': '2px solid rgba(0, 0, 0, .2)',
                    'borderRadius': '8px',
                    'boxShadow': '0px 8px 8px rgba(0,0,0,.2)'
                };
                for (i in level_data.slice(1, 10)) {
                    Crafty.e('2D, DOM, Color, Platform, Collision, Tween, Delay').attr(level_data[i])
                    // .color("#c2aa48")
                    .color('#888')
                    // .collision(new Crafty.polygon([0, 0], [attr.w, 0], [attr.w, attr.h], [0, attr.h]))
                    .collision().css(css);

                    // if (0 === i % (10 + ~~ (Math.random() * 10))) {
                    //     // var e = Crafty.e("2D, DOM, Color, Pickup, Tween, Delay").attr({x: p.x + (100-24)/2, y: p.y - 24, w:24, h:24}).color("#FF00FF");
                    //     var e = Crafty.e("2D, DOM, Image, Pickup, Tween, Delay").attr({
                    //         x: p.x + (100 - 24) / 2,
                    //         y: p.y - 40
                    //     }).image('fork.png');
                    //     p.attach(e);
                    // }
                }
            })();


            function updateHUD() {
                this.x = -Crafty.viewport.x;
                this.y = -Crafty.viewport.y;
            }
            var hud = Crafty.e('2D, DOM, HUD').attr({
                x: 0,
                y: 0,
                w: STAGE_WIDTH,
                h: STAGE_HEIGHT
            }).bind('EnterFrame', updateHUD);

            function updateScore() {
                score = Math.max(score, ~~ ((Crafty.viewport.height - Crafty('Player').y) * 0.1 - 1));
                this.text(score.toString());
            }

            hud.attach(Crafty.e('2D, DOM, Text, Score').attr({
                x: 10,
                z: 9999
            }).css({
                'font': '48px Chewy, Impact',
                'color': '#fff',
                'text-align': 'left',
                'textShadow': '0px 2px 4px rgba(0,0,0,.5)'
            }).bind('EnterFrame', updateScore));

            hud.attach(Crafty.e('HTML, Stars, Tween, Delay').attr({
                x: Crafty.viewport.width / 2 - 48,
                y: -16,
                w: 200,
                z: 9999
            }));

            function toggleSFX(e) {
                // if (e.mouseButton !== Crafty.mouseButtons.LEFT) return;
                SFX = !SFX;
                Crafty('SFX').image('assets/images/' + (SFX ? 'speaker.png' : 'mute.png'));
            }

            // hud.attach(Crafty.e('2D, DOM, SFX, Image, Mouse').attr({
            hud.attach(Crafty.e('2D, DOM, Mouse, Image, SFX').attr({
                x: Crafty.viewport.width - 64,
                y: -Crafty.viewport.y + 10,
                w: 48,
                h: 48,
                z: 9999
            }).css('cursor', 'pointer').image('assets/images/speaker.png')
            // .areaMap([0,0], [50,0], [50,50], [0,50])
            .bind('MouseOver', function(e) {
                this.alpha = 0.8;
                this.bind('MouseDown', toggleSFX);
            }).bind('MouseOut', function(e) {
                this.alpha = 1;
                this.unbind('MouseDown', toggleSFX);
            }));
            Crafty('SFX')._element.onclick = toggleSFX;
        });

        Crafty.scene('loading', function() {
            var imgPath = function(x) {
                    return 'assets/images/' + x;
                };
            var sndPath = function(x) {
                    return 'assets/sounds/' + x;
                };

            Crafty.background('#fff');

            var images = [];
            images = images.concat('title.png', 'cratfy_logo.png', 'github_logo.png');
            images = images.concat('bg.png', 'octocat.png', 'portal.png', 'smoke_jump.png', 'speaker.png', 'mute.png');

            Crafty.load(images.map(imgPath), function onLoad() {
                $('#loader').remove();


                // Crafty.sprite(96, R.OCTOCAT_PNG, {
                Crafty.sprite(96, 'assets/images/octocat.png', {
                    // Crafty.sprite(96, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAABgBAMAAADm2ri6AAAAG1BMVEUo6Ns3NzdAQEBcXFzDV07zu57/yq/i4uL///+iSnSMAAAAAXRSTlMAQObYZgAAAbtJREFUeNrtmtFOgzAUhts9AZ1ZvB34BMorEO+9qPEBtPHWqz2BC48t5VQoY7KSqOdU/z9kY+Nru28ppaEohSAIgiAIgsTRJqTIk4cAL9/R2yqkTCgjjYcAK089rYpC3+TCQ4Bf4Kqu76pJbur61uTCQ0CCQDXLcgOieAjwC2yrMylNLjwEmHlt4qtdfBU8P4WSxkNAiEBpbBTqhUsNyOEhIEPA7Gzbtq5Pt2MfzHIDgngISBDoOtxT2zRNe3Tutd95993uywZE8RCAAAT+hEDghgJHt9yAIB4CjPzGz5DoXqR9dPGVz71Yuhfpib1UHgLcPO2FJZCd9exz09z7927yRFNwqlcmDwF2gdDt9p+LIlSGaFoO2cRnjEgeAtz8+FmbSYqxxl/mw9E0HgLsAidLs3FUwuL+9/PaHN78trZ+CHAJhANRhxv2kx5Fusjr2e+4yBfKXB9SeQiwC3Qobf1QFQoUKqmBBH51/bF2Cg8BboGxh+lUARrmEvmhE6fWf/JPQUC+wPoC42TrR38QBHITmA9byw/LSuMhwMxrMxnvhtdceAiwC8Tjo0o4Y0TyEGAXQBAEQRAE+Tf5AOPSFLJkyU14AAAAAElFTkSuQmCC", {
                    Octocat: [0, 0]
                });

                // Crafty.sprite(64, R.SMOKE_JUMP_PNG, {
                Crafty.sprite(64, 'assets/images/smoke_jump.png', {
                    SmokeJump: [0, 0]
                });

                Crafty.sprite(192, 'assets/images/portal.png', {
                    // Crafty.sprite(192, R.PORTAL_PNG, {
                    Portal: [0, 0]
                });

                Crafty.audio.add({
                    jump: ['jump.mp3', 'jump.ogg', 'jump.wav'].map(sndPath),
                    push: ['push.mp3', 'push.ogg', 'push.wav'].map(sndPath),
                    pull: ['pull.mp3', 'pull.ogg', 'pull.wav'].map(sndPath),
                    fork: ['fork.mp3', 'fork.ogg', 'fork.wav'].map(sndPath),
                    star: ['star.mp3', 'star.ogg', 'star.wav'].map(sndPath),
                    dead: ['dead.mp3', 'dead.ogg', 'dead.wav'].map(sndPath),
                    click: ['click.mp3', 'click.ogg', 'click.wav'].map(sndPath)
                });

                // setTimeout(function () {
                //     Crafty.scene("intro");
                // }, 500);
                Crafty.scene('intro');
            });
        });

        Crafty.scene('intro', function initIntro() {
            Crafty.background('#fff');

            var txt = Crafty.e('2D, DOM, Text, Delay').attr({
                x: 4,
                y: Crafty.viewport.height - 16,
                w: Crafty.viewport.width,
                alpha: 0
            }).css({
                'font': '10px Verdana, Arial',
                'color': '#888',
                'text-align': 'center'
            }).text('Press ESC to skip intro');
            txt.bind('EnterFrame', function(e) {
                var f = e.frame % 100;
                this.alpha = ~~ (f < 50);
            });
            Crafty.e('Keyboard').bind('KeyDown', function(e) {
                if (e.keyCode !== Crafty.keys.ESC) return;
                this.destroy();
                Crafty.scene('main');
            });

            //TODO: un-nest this crap
            Crafty.e('2D, Canvas, Image, Tween, Delay').attr({
                x: (400 - 174) / 2,
                y: (640 - 174) / 2,
                alpha: 0
            }).image('assets/images/github_logo.png').tween({
                // }).image(R.GITHUB_LOGO_PNG).tween({
                alpha: 1
            }, 50).bind('TweenEnd', function() {
                this.unbind('TweenEnd');
                this.delay(function() {
                    this.tween({
                        alpha: 0
                    }, 50).bind('TweenEnd', function() {
                        this.unbind('TweenEnd');
                        var crafty = Crafty.e('2D, Canvas, Image, Tween, Delay').attr({
                            x: (400 - 147) / 2,
                            y: (640 - 120) / 2,
                            alpha: 0
                            // }).image(R.CRATFY_LOGO_PNG).tween({
                        }).image('assets/images/cratfy_logo.png').tween({
                            alpha: 1
                        }, 50).bind('TweenEnd', function() {
                            this.unbind('TweenEnd');
                            this.delay(function() {
                                this.tween({
                                    alpha: 0
                                }, 50).bind('TweenEnd', function() {
                                    Crafty.e('2D, Canvas, Image, Tween, Keyboard').attr({
                                        alpha: 0
                                        // }).image(R.TITLE_PNG).tween({
                                    }).image('assets/images/title.png').tween({
                                        alpha: 1
                                    }, 100).bind('TweenEnd', function() {
                                        txt.text('Press any key to start the game').css('color', '#fff');
                                        this.bind('KeyDown', function() {
                                            Crafty.scene('main');
                                        });
                                    });

                                    // setTimeout(function () {
                                    //     Crafty.scene("main");
                                    // }, 250);
                                });
                            }, 500);
                        });
                    });
                }, 500);
            });
        });

        Crafty.scene('loading');
    });
})(jQuery, Crafty);
