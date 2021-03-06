import * as vscode from 'vscode';

export class F5TreeProvider implements vscode.TreeDataProvider<F5Host> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<F5Host | undefined> = new vscode.EventEmitter<F5Host | undefined>();
	readonly onDidChangeTreeData: vscode.Event<F5Host | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: F5Host): vscode.TreeItem {
		return element;
	}

	getChildren(element?: F5Host): Thenable<F5Host[]> {
        
        var bigipHosts: any | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		// console.log(`bigips: ${JSON.stringify(bigipHosts)}`);
		
		if ( bigipHosts === undefined) {
			throw new Error('No configured hosts - from hostTreeProvider');
		}

		console.log('checking for legacy hosts config');


		/**
		 * 7.27.2020
		 * the following code bloc detects the legacy device configuration structure of an array of strings
		 * 	then converts it to the new structure for the new devices view, which is an array of objects.  
		 * 
		 * Should only run once when it detects the legacy config the first time.
		 * 
		 * Should be able remove this down the road
		 */

		// if devices in list and first list item is a string, not an object
		if(bigipHosts.length > 0 && typeof(bigipHosts[0]) === 'string') {
			
			console.log('devices are type of:', typeof(bigipHosts[0]));
			bigipHosts = bigipHosts.map( (el: any) => {
				let newObj: { device: string } = { device: el };
				console.log(`device coverted from: ${el} -> ${JSON.stringify(newObj)}`);
				return newObj;
			});
			
			console.log('conversion complete, saving new devices list:', bigipHosts);
			// save config
			vscode.workspace.getConfiguration().update('f5.hosts', bigipHosts, vscode.ConfigurationTarget.Global);
			vscode.window.showWarningMessage('Legacy device config list converted!!!');
		} else {
			console.log('New device configuration list detected -> no conversion');
		}

		const treeItems = bigipHosts.map( (item: { 
			device: string;
			provider: string;
		}) => {

			// build device string to display
			// let device = `${item.user}@${item.host}`;

			// add port if it's defined - non default 443
			// if(item.hasOwnProperty('port')) {
			// 	device = `${device}:${item.port}`;
			// }

			// add default provider=local if not defined
			if(!item.hasOwnProperty('provider')){
				item['provider'] = 'local';
			}

			// console.log('built item', device);
			const treeItem = new F5Host(item.device, item.provider, vscode.TreeItemCollapsibleState.None, {
				        command: 'f5.connectDevice',
				        title: 'hostTitle',
				        arguments: [item]
			});
			return treeItem;
		});

        return Promise.resolve(treeItems);
	}

	async addDevice(newHost: string) {

		let bigipHosts: {device: string} [] | undefined = await vscode.workspace.getConfiguration().get('f5.hosts');

		if(!newHost) {
			// attempt to get user to input new device
			newHost = await vscode.window.showInputBox({
				prompt: 'Device/BIG-IP/Host',
				placeHolder: '<user>@<host/ip>'
			})
			.then( el => {
				if(el) {
					return el;
				} else {
					throw new Error('user escapted new device input');
				}
			});
		}

		if (bigipHosts === undefined) {
			// throw new Error('no devices in config?');
			bigipHosts = [];
		}

		const deviceRex = /^[\w-.]+@[\w-.]+(:[0-9]+)?$/;		// matches any username combo an F5 will accept and host/ip
		const devicesString = JSON.stringify(bigipHosts);

		if (!devicesString.includes(`\"${newHost}\"`) && deviceRex.test(newHost)){
			bigipHosts.push({device: newHost});
			await vscode.workspace.getConfiguration().update('f5.hosts', bigipHosts, vscode.ConfigurationTarget.Global);
			// vscode.window.showInformationMessage(`Adding ${newHost} to list!`);
			this.refresh();
			return `${newHost} added to device configuration`;
		} else {
			vscode.window.showErrorMessage('Already exists or invalid format: <user>@<host/ip>');
			return 'FAILED - Already exists or invalid format: <user>@<host/ip>';
			// Promise.reject('Already exists or invalid format: <user>@<host/ip>');
			// throw new Error('Already exists or invalid format: <user>@<host/ip>');
		}
	}

	async removeDevice(hostID: any) {
		console.log(`Remove Host command: ${JSON.stringify(hostID)}`);
		
		let bigipHosts: {device: string} [] | undefined = vscode.workspace.getConfiguration().get('f5.hosts');
		
		if ( !bigipHosts || !hostID) {
			throw new Error('device delete, no devices in config or no selected host to delete');
		}

		const newBigipHosts = bigipHosts.filter( item => item.device !== hostID.label);

		 if(bigipHosts.length === (newBigipHosts.length+1) ) {
			console.log('successfully removed device!!!');
			await vscode.workspace.getConfiguration().update('f5.hosts', newBigipHosts, vscode.ConfigurationTarget.Global);
			setTimeout( () => { this.refresh();}, 300);
			return `successfully removed ${hostID.label} from devices configuration`;
		 } else {
			console.log('something with remove device FAILED!!!');
			throw new Error('something with remove device FAILED!!!');
		 }

	}

}

export class F5Host extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `Connect`;
	}

	get description(): string {
		return this.version;
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

    // contextValue = 'dependency';
    
}