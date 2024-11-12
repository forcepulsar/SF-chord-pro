public with sharing class SongChordController {
    @AuraEnabled(cacheable=true)
    public static String getSongChordPro(Id recordId) {
        Song__c song = [SELECT Id, Name, ChordPro_Content__c 
                       FROM Song__c 
                       WHERE Id = :recordId 
                       WITH SECURITY_ENFORCED
                       LIMIT 1];
        return song.ChordPro_Content__c;
    }

    @AuraEnabled
    public static String updateSongChordPro(Id recordId, String chordProContent) {
        try {
            // Query for the song record
            Song__c song = [SELECT Id, ChordPro_Content__c 
                          FROM Song__c 
                          WHERE Id = :recordId 
                          WITH SECURITY_ENFORCED];
            
            // Check if user has permission to update
            if (!Schema.sObjectType.Song__c.fields.ChordPro_Content__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient permissions to update song content');
            }
            
            // Update the content
            song.ChordPro_Content__c = chordProContent;
            update song;
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Error updating song: ' + e.getMessage());
        }
    }
}