import { 
        Mesh, 
        CylinderGeometry, 
        MeshBasicMaterial, 
        Raycaster, 
        Vector3, 
        Quaternion
    } from '../../libs/three128/three.module.js';

class BulletHandler{
    constructor(game){
        this.game = game;
        this.scene = game.scene;
        const geometry = new CylinderGeometry(0.01, 0.01, 0.08);
        geometry.rotateX( Math.PI/2 );
        const material = new MeshBasicMaterial();
        this.bullet = new Mesh(geometry, material);

        this.bullets = [];

        this.npcs = [];
        this.game.npcHandler.npcs.forEach( npc => {
            let found = false;
            npc.object.traverse( child => {
                if ( !found && child.isMesh ){
                    this.npcs.push(child);
                    child.userData.controller = npc;
                    found = true;
                }
            })
        });

        let found = false;
        this.game.user.object.traverse( child => {
            if ( !found && child.isMesh && !child.name.includes('Rifle') ){
                this.user = child;
                child.userData.controller = this.game.user;
                found = true;
            }
        }); 

        this.raycaster = new Raycaster();
        this.forward = new Vector3( 0, 0, -1 );
        this.xAxis = new Vector3( 1, 0, 0 );
        this.tmpQuat = new Quaternion();
    }

    createBullet( pos, quat, user=false){
        const bullet = this.bullet.clone();
        bullet.position.copy(pos);
        bullet.quaternion.copy(quat);
        //bullet.rotateY(0.2);
        bullet.userData.targetType = (user) ? 1 : 2;
        bullet.userData.distance = 0;
        this.scene.add(bullet);
        this.bullets.push(bullet);
    }

    update(dt){
        this.bullets.forEach( bullet => {
            bullet.getWorldQuaternion( this.tmpQuat );
            const dir = this.forward.clone().applyQuaternion( this.tmpQuat );
            this.raycaster.set(bullet.position, dir);

            const dist = dt * 15;
            let intersects;

            if (bullet.userData.targetType==1){
                intersects = this.raycaster.intersectObject(this.user);
            }else{
                intersects = this.raycaster.intersectObjects(this.npcs);
            }

            if (intersects.length>0){
                if (intersects[0].distance<dist){
                    intersects[0].object.userData.controller.action = 'shot';
                    bullet.userData.remove = true;
                }
            }else{
                bullet.translateZ(dist);
                bullet.userData.distance += dist;
                bullet.userData.remove = (bullet.userData.distance > 50);
            }
        });

        let found = false;
        do{
            let remove;
            found = this.bullets.some( bullet => {
                if (bullet.userData.remove){
                    remove = bullet;
                    return true;
                }
            });
            if (found){
                const index = this.bullets.indexOf(remove);
                if (index!==-1) this.bullets.splice(index, 1);
            }
            
        }while(found);
    }
}

export { BulletHandler };