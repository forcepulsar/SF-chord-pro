public with sharing class SongChordEditor {
    @AuraEnabled(cacheable=true)
    public static String getChordProContent(Id recordId) {
        Song__c song = [SELECT ChordPro_Content__c 
                       FROM Song__c 
                       WHERE Id = :recordId 
                       LIMIT 1];
        return song.ChordPro_Content__c;
    }

    @AuraEnabled
    public static void saveChordProContent(Id recordId, String content) {
        Song__c song = [SELECT Id 
                       FROM Song__c 
                       WHERE Id = :recordId 
                       LIMIT 1];
        
        song.ChordPro_Content__c = content;
        update song;
    }    
}