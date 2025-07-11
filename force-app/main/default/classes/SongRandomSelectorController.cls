public with sharing class SongRandomSelectorController {
    @AuraEnabled
    public static Id getRandomSongId() {
        List<Song__c> songs = [SELECT Id FROM Song__c where ChordPro_Status__c = 'In Progress' or ChordPro_Status__c = 'Done' order by Id];
        if (songs.isEmpty()) return null;
        Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), songs.size());
        return songs[idx].Id;
    }
}