import { LightningElement } from 'lwc';
import getRandomSongId from '@salesforce/apex/SongRandomSelectorController.getRandomSongId';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RandomSongQuickAction extends NavigationMixin(LightningElement) {
    isLoading = false;

    handleClick() {
        this.isLoading = true;
        getRandomSongId()
            .then(songId => {
                if (songId) {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: songId,
                            objectApiName: 'Song__c',
                            actionName: 'view'
                        }
                    });
                } else {
                    this.showToast('No Songs', 'No Song__c records found.', 'warning');
                }
            })
            .catch(error => {
                this.showToast('Error', error.body ? error.body.message : error.message, 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}