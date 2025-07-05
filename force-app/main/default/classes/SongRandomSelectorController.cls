public with sharing class SongRandomSelectorController {
    @AuraEnabled
    public static Id getRandomSongId() {
        List<Song__c> songs = [SELECT Id FROM Song__c];
        if (songs.isEmpty()) return null;
        Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), songs.size());
        return songs[idx].Id;
    }
}