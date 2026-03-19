class AircraftCarrier {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.isEnemy = options.isEnemy || false;
        this.maxHealth = 420;
        this.health = this.maxHealth;
        this.width = 92;
        this.height = 28;
        this.range = 760;
        this.fireRate = 95;
        this.cooldown = 0;
        this.markedForDeletion = false;
        this.direction = this.isEnemy ? -1 : 1;
        this.hullColor = this.isEnemy ? '#705043' : '#425468';
        this.deckColor = this.isEnemy ? '#b98972' : '#d4e4f2';
        this.towerColor = this.isEnemy ? '#8f6657' : '#627a91';
        this.planeColor = this.isEnemy ? '#ffd0b6' : '#d9edf8';
        this.projectileColor = this.isEnemy ? '#ffb27d' : '#b9ecff';
        this.planes = [];

        for (let i = 0; i < 3; i++) {
            this.planes.push(this.createPlane(i));
        }
    }

    createPlane(index) {
        return {
            slot: index,
            state: 'ready',
            x: this.x + ((index - 1) * 14),
            y: this.y - 16,
            altitude: 0,
            cooldown: 0,
            target: null,
            returning: false
        };
    }

    update(enemies, fieldWidth, fieldHeight) {
        if (this.cooldown > 0) this.cooldown--;

        const target = this.findTarget(enemies);
        if (target && this.cooldown <= 0) {
            const readyPlane = this.planes.find(plane => plane.state === 'ready');
            if (readyPlane) {
                readyPlane.state = 'taking-off';
                readyPlane.target = target;
                readyPlane.returning = false;
                readyPlane.altitude = 0;
                this.cooldown = this.fireRate;
            }
        }

        this.planes.forEach(plane => this.updatePlane(plane, enemies, fieldWidth, fieldHeight));
        this.x = Math.max(this.width / 2, Math.min(fieldWidth - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(fieldHeight - this.height / 2, this.y));
    }

    updatePlane(plane, enemies, fieldWidth, fieldHeight) {
        if (plane.cooldown > 0) plane.cooldown--;

        if (plane.state === 'ready') {
            plane.x = this.x + ((plane.slot - 1) * 14);
            plane.y = this.y - 16;
            plane.altitude = 0;
            return;
        }

        if (plane.state === 'taking-off') {
            plane.x += 3.8 * this.direction;
            plane.y -= 1.2;
            plane.altitude = Math.min(72, plane.altitude + 4);
            if (plane.altitude >= 72) {
                plane.state = 'airborne';
                if (!plane.target || plane.target.markedForDeletion) {
                    plane.target = this.findTarget(enemies);
                }
            }
            return;
        }

        if (plane.state === 'airborne') {
            if (!plane.returning) {
                if (!plane.target || plane.target.markedForDeletion) {
                    plane.target = this.findTarget(enemies);
                    if (!plane.target) {
                        plane.returning = true;
                    }
                }

                if (!plane.returning && plane.target) {
                    this.flyPlaneToward(plane, plane.target.x, plane.target.y - 48, 6.6);
                    const dist = Math.hypot(plane.target.x - plane.x, plane.target.y - plane.y);
                    if (dist <= 70 && plane.cooldown <= 0) {
                        plane.target.takeDamage(22);
                        plane.cooldown = 28;
                    }
                    if (dist <= 36) {
                        plane.returning = true;
                    }
                }
            }

            if (plane.returning) {
                this.flyPlaneToward(plane, this.x + (this.direction * 30), this.y - 30, 6.2);
                const homeDist = Math.hypot((this.x + (this.direction * 30)) - plane.x, (this.y - 30) - plane.y);
                if (homeDist <= 18) {
                    plane.state = 'landing';
                }
            }
            return;
        }

        if (plane.state === 'landing') {
            plane.x += (this.x - plane.x) * 0.18;
            plane.y += ((this.y - 16) - plane.y) * 0.18;
            plane.altitude = Math.max(0, plane.altitude - 5);
            if (plane.altitude <= 0.5) {
                plane.state = 'ready';
                plane.target = null;
                plane.returning = false;
            }
        }

        plane.x = Math.max(0, Math.min(fieldWidth, plane.x));
        plane.y = Math.max(0, Math.min(fieldHeight, plane.y));
    }

    flyPlaneToward(plane, targetX, targetY, speed) {
        const dx = targetX - plane.x;
        const dy = targetY - plane.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;
        plane.x += (dx / dist) * speed;
        plane.y += (dy / dist) * speed;
    }

    findTarget(enemies) {
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.markedForDeletion) continue;
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        return closest;
    }

    takeDamage(amount) {
        this.health -= amount * 0.85;
        if (this.health <= 0) {
            this.markedForDeletion = true;
        }
    }

    containsPoint(x, y) {
        return (
            x >= this.x - this.width / 2 &&
            x <= this.x + this.width / 2 &&
            y >= this.y - this.height / 2 &&
            y <= this.y + this.height / 2
        );
    }

    drawPlane(ctx, plane) {
        const drawY = plane.y - (plane.altitude * 0.34);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(plane.x, plane.y + 10, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.planeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(plane.x - 11, drawY);
        ctx.lineTo(plane.x + 11, drawY);
        ctx.stroke();

        ctx.fillStyle = this.planeColor;
        ctx.beginPath();
        ctx.ellipse(plane.x, drawY, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(plane.x - 2, drawY - 7, 4, 14);
    }

    draw(ctx) {
        ctx.fillStyle = this.hullColor;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fillStyle = this.towerColor;
        ctx.fillRect(this.x - 8, this.y - this.height / 2 - 12, 16, 18);
        ctx.strokeStyle = this.deckColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2 + 12, this.y + 2);
        ctx.lineTo(this.x + this.width / 2 - 12, this.y + 2);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 28, this.y - this.height / 2 - 20, 56, 5);
        ctx.fillStyle = '#7ad36b';
        ctx.fillRect(this.x - 28, this.y - this.height / 2 - 20, 56 * (this.health / this.maxHealth), 5);

        this.planes.forEach(plane => {
            if (plane.state !== 'ready') {
                this.drawPlane(ctx, plane);
            }
        });

        ctx.fillStyle = this.deckColor;
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'center';
        const readyCount = this.planes.filter(plane => plane.state === 'ready').length;
        ctx.fillText(`${readyCount}/3`, this.x, this.y + 24);
    }
}

