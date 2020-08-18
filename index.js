module.exports = class extends window.casthub.card.action {

    constructor() {
        super();

        this.sceneItemMap = {};

        /**
         * The OBS WebSocket Instance for the action.
         *
         * @type {WS|null}
         */
        this.ws = null;
    }

    /**
     * Called once when the Action is booted on App
     * launch or when installed for the first time.
     *
     * @return {Promise}
     */
    async mounted() {

        const { id } = this.identity;
        this.ws = await window.casthub.ws(id);

        await this.refresh();
        await super.mounted();
    }

    async refresh() {

        const scenes = await this.getScenes();
        
        scenes.forEach(scene => {
            const { sources } = scene;
            sources.forEach(source => {
                const generatedName = `${encodeURI(scene.name)}|${encodeURI(source.name)}`;
                this.sceneItemMap[generatedName] = {
                    sceneName: scene.name,
                    sourceName: source.name
                }
            });
        });
    }

    /**
     * Asynchronously builds all of the properties for this Module.
     *
     * @return {Promise}
     */
    async prepareProps() {   

        let options = {};

        const items = Object.keys(this.sceneItemMap);
        const itemCount = items.length;

        for(let i = 0; i < itemCount; i++) {
            options[items[i]] = { text: `${this.sceneItemMap[items[i]].sceneName} - ${this.sceneItemMap[items[i]].sourceName} `, icon: 'widgets'};
        }

        return {
            sceneItem: {
                type: 'select',
                required: true,
                default: null,
                label: 'Source',
                help: 'Select a source to toggle',
                options
            },
            visibility: {
                type: 'select',
                required: true,
                default: 'toggle',
                label: 'State',
                help: 'Hide, show or toggle the source visibilty',
                options: {
                    toggle: { text: 'Toggle', icon: 'code' },
                    show: { text: 'Show', icon: 'remove_red_eye' },
                    hide: { text: 'Hide', icon: 'stop_screen_share' },
                }                
            },
        };
    }

    /**
     * Called when a Trigger has executed and all Conditions have passed.
     *
     * @param {Object} input The output, if any, from the Trigger.
     */
    async run(input) {

        if(this.props.sceneItem === null) return false;
        if(!this.sceneItemMap.hasOwnProperty(this.props.sceneItem)) return;

        const { sceneName, sourceName } = this.sceneItemMap[this.props.sceneItem];

        await this.setSourceVisibility(sceneName, sourceName, this.props.visibility);
    }

    async getScenes() {

        const { scenes } = await this.ws.send('GetSceneList');

        return scenes;
    }

    async setSourceVisibility(scene, source, visibility) {
        
        const sourceSettings = await this.ws.send('GetSceneItemProperties', { 
            'scene-name': scene,
            'item': source 
        });
        
        switch(visibility) {
            case 'hide':
                await this.ws.send('SetSceneItemProperties', {
                    'scene-name': scene, 
                    'item': source, 
                    'visible': false
                });
                break;
            case 'show':
                await this.ws.send('SetSceneItemProperties', {
                    'scene-name': scene, 
                    'item': source, 
                    'visible': true
                });
                break;
            case 'toggle':
                await this.ws.send('SetSceneItemProperties', {
                    'scene-name': scene, 
                    'item': source, 
                    'visible': !sourceSettings.visible
                });
                break;
            default:
                break;
        }
    }

};
